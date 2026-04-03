import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServiceClient } from '@/lib/supabase';
import { buildSystemPrompt } from '@/lib/plans';
import type { Plan, Enrichment, EnrichedCanvas, CostVersion, CostItem } from '@/lib/plans';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

const MAX_MESSAGE_LENGTH = 2000;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function parseEnrichments(text: string, planId: number): Omit<Enrichment, 'id' | 'created_at'>[] {
  const out: Omit<Enrichment, 'id' | 'created_at'>[] = [];
  const re = /---VERRIJKING---\s*\ntype:\s*(costs|permits|contacts|tips|general)\s*\ntitel:\s*(.+)\s*\ninhoud:\s*([\s\S]*?)\s*\n---EINDE---/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ plan_id: planId, type: m[1] as Enrichment['type'], title: m[2].trim(), content: m[3].trim(), source: 'chat' });
  }
  return out;
}

function parseCanvasUpdate(text: string): Record<string, string> | null {
  const match = text.match(/---CANVAS---\s*\n([\s\S]*?)\n---EINDE_CANVAS---/);
  if (!match) return null;
  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m && m[2].trim() !== 'GEEN') fields[m[1]] = m[2].trim();
  }
  return Object.keys(fields).length > 0 ? fields : null;
}

function parseCostUpdate(text: string): { item: string; low: number; high: number; note: string }[] | null {
  const match = text.match(/---KOSTEN---\s*\n([\s\S]*?)\n---EINDE_KOSTEN---/);
  if (!match) return null;
  const items = match[1].split('\n').filter(l => l.trim().startsWith('item:')).map((line) => {
    const m = line.match(/item:\s*(.+?)\s*\|\s*low:\s*(\d+)\s*\|\s*high:\s*(\d+)\s*(?:\|\s*note:\s*(.+))?/);
    if (!m) return null;
    return { item: m[1].trim(), low: parseInt(m[2]), high: parseInt(m[3]), note: m[4]?.trim() || '' };
  }).filter(Boolean) as { item: string; low: number; high: number; note: string }[];
  return items.length > 0 ? items : null;
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIp(req);
  const limit = rateLimit(ip, 'chat');
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Je stuurt te veel berichten. Wacht even en probeer het opnieuw.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const body = await req.json();
    const planId = body.planId as number;
    const messages = body.messages as { role: 'user' | 'assistant'; content: string }[];

    // Validate planId
    if (!planId || typeof planId !== 'number') {
      return NextResponse.json({ error: 'Ongeldig plan ID' }, { status: 400 });
    }

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Geen berichten' }, { status: 400 });
    }

    // Cap message length
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.content?.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Bericht is te lang (max ${MAX_MESSAGE_LENGTH} tekens).` },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Fetch plan from DB (don't trust client-sent plan data)
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !planData) {
      return NextResponse.json({ error: 'Plan niet gevonden' }, { status: 404 });
    }

    // Map DB row to Plan type
    const plan: Plan = {
      id: planData.id,
      name: planData.name,
      category: planData.category,
      team: planData.team || [],
      for_whom: planData.for_whom || '',
      why: planData.why || '',
      need: planData.need || '',
      challenge: planData.challenge || '',
      frameworks: planData.frameworks || '',
      enablers: planData.enablers || '',
      steps: planData.steps || '',
      budget: planData.budget || '',
      tier: planData.tier || 3,
      costs: planData.costs || [],
      costs_total: planData.costs_total || '',
    };

    // Load context
    const [enrichRes, canvasRes, versionsRes] = await Promise.all([
      supabase.from('enrichments').select('*').eq('plan_id', planId).order('created_at'),
      supabase.from('enriched_canvas').select('*').eq('plan_id', planId).single(),
      supabase.from('cost_versions').select('*').eq('plan_id', planId).eq('is_active', true).order('version_number', { ascending: false }).limit(1),
    ]);

    const existingEnrichments = (enrichRes.data as Enrichment[]) || [];
    const existingCanvas = canvasRes.data as EnrichedCanvas | null;

    let activeCostItems: CostItem[] = [];
    const activeVersion = versionsRes.data?.[0] as CostVersion | undefined;
    if (activeVersion) {
      const { data } = await supabase.from('cost_items').select('*').eq('version_id', activeVersion.id).order('sort_order');
      activeCostItems = (data as CostItem[]) || [];
    }

    const systemPrompt = buildSystemPrompt(plan, existingEnrichments, existingCanvas, activeCostItems);

    // Truncate conversation history to last 20 messages to control costs
    const truncatedMessages = messages.slice(-20);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: systemPrompt,
      messages: truncatedMessages.map(m => ({ role: m.role, content: m.content })),
    });

    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('\n');

    // Save chat messages
    if (lastMsg?.role === 'user') {
      await supabase.from('chat_messages').insert({ plan_id: planId, role: 'user', content: lastMsg.content.slice(0, MAX_MESSAGE_LENGTH) });
    }
    await supabase.from('chat_messages').insert({ plan_id: planId, role: 'assistant', content: assistantMessage });

    // Parse enrichments
    const newEnrichments = parseEnrichments(assistantMessage, planId);
    if (newEnrichments.length > 0) await supabase.from('enrichments').insert(newEnrichments);

    // Parse canvas update
    let canvasUpdated = false;
    const canvasUpdate = parseCanvasUpdate(assistantMessage);
    if (canvasUpdate) {
      if (existingCanvas) {
        await supabase.from('enriched_canvas').update({ ...canvasUpdate, updated_at: new Date().toISOString() }).eq('plan_id', planId);
      } else {
        await supabase.from('enriched_canvas').insert({ plan_id: planId, ...canvasUpdate, updated_at: new Date().toISOString() });
      }
      canvasUpdated = true;
    }

    // Parse cost update → create new version
    let costsUpdated = false;
    const costUpdate = parseCostUpdate(assistantMessage);
    if (costUpdate) {
      const { data: allVersions } = await supabase.from('cost_versions').select('version_number').eq('plan_id', planId).order('version_number', { ascending: false }).limit(1);
      const newVersionNumber = (allVersions?.[0]?.version_number || 0) + 1;

      await supabase.from('cost_versions').update({ is_active: false }).eq('plan_id', planId);

      const { data: newVersion } = await supabase.from('cost_versions').insert({
        plan_id: planId, version_number: newVersionNumber,
        label: `AI inschatting v${newVersionNumber}`, is_active: true,
      }).select().single();

      if (newVersion) {
        await supabase.from('cost_items').insert(
          costUpdate.map((c, i) => ({ version_id: newVersion.id, plan_id: planId, item: c.item, amount_low: c.low, amount_high: c.high, note: c.note, sort_order: i }))
        );
      }
      costsUpdated = true;
    }

    const cleanMessage = assistantMessage
      .replace(/---CANVAS---[\s\S]*?---EINDE_CANVAS---/g, '')
      .replace(/---KOSTEN---[\s\S]*?---EINDE_KOSTEN---/g, '')
      .replace(/---VERRIJKING---[\s\S]*?---EINDE---/g, '')
      .trim();

    return NextResponse.json({ message: cleanMessage, enrichments: newEnrichments, canvasUpdated, costsUpdated });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis. Probeer het opnieuw.' }, { status: 500 });
  }
}
