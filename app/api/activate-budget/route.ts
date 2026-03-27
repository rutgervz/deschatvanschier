import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

function determineTier(low: number, high: number): number {
  const avg = (low + high) / 2;
  if (avg <= 700) return 1;
  if (avg <= 2500) return 2;
  if (avg <= 15000) return 3;
  if (avg <= 50000) return 4;
  if (avg <= 150000) return 5;
  return 6;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(ip, 'general');
  if (!limit.ok) return NextResponse.json({ error: 'Te veel verzoeken' }, { status: 429 });

  try {
    const body = await req.json();
    const planId = body.planId;
    const versionId = body.versionId;
    const type = body.type;

    // Validate input
    if (!planId || typeof planId !== 'number') {
      return NextResponse.json({ error: 'Ongeldig planId' }, { status: 400 });
    }
    if (type !== 'original' && type !== 'ai') {
      return NextResponse.json({ error: 'Ongeldig type' }, { status: 400 });
    }
    if (type === 'ai' && (!versionId || typeof versionId !== 'string')) {
      return NextResponse.json({ error: 'Ongeldig versionId' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Verify plan exists
    const { data: planCheck } = await supabase.from('plans').select('id').eq('id', planId).single();
    if (!planCheck) return NextResponse.json({ error: 'Plan niet gevonden' }, { status: 404 });

    if (type === 'original') {
      await supabase.from('plans').update({
        active_budget: '',
        active_tier: 0,
        active_costs_label: '',
      }).eq('id', planId);
    } else {
      // Verify version belongs to this plan
      const { data: versionCheck } = await supabase
        .from('cost_versions')
        .select('id, label, plan_id')
        .eq('id', versionId)
        .single();

      if (!versionCheck || versionCheck.plan_id !== planId) {
        return NextResponse.json({ error: 'Versie hoort niet bij dit plan' }, { status: 403 });
      }

      const { data: items } = await supabase
        .from('cost_items')
        .select('*')
        .eq('version_id', versionId)
        .order('sort_order');

      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'Geen kostenposten gevonden' }, { status: 404 });
      }

      const totalLow = items.reduce((s: number, c: { amount_low: number }) => s + c.amount_low, 0);
      const totalHigh = items.reduce((s: number, c: { amount_high: number }) => s + c.amount_high, 0);
      const newTier = determineTier(totalLow, totalHigh);
      const budgetStr = `€${totalLow.toLocaleString('nl-NL')}–€${totalHigh.toLocaleString('nl-NL')}`;

      await supabase.from('cost_versions').update({ is_active: false }).eq('plan_id', planId);
      await supabase.from('cost_versions').update({ is_active: true }).eq('id', versionId);

      await supabase.from('plans').update({
        active_budget: budgetStr,
        active_tier: newTier,
        active_costs_label: versionCheck.label || '',
      }).eq('id', planId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activate budget error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
