import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(ip, 'general');
  if (!limit.ok) return NextResponse.json({ error: 'Te veel verzoeken' }, { status: 429 });

  const planId = req.nextUrl.searchParams.get('planId');
  if (!planId) return NextResponse.json({ error: 'planId is verplicht' }, { status: 400 });

  const parsed = parseInt(planId);
  if (isNaN(parsed)) return NextResponse.json({ error: 'Ongeldig planId' }, { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('helpers')
    .select('*')
    .eq('plan_id', parsed)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ helpers: data || [] });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(ip, 'general');
  if (!limit.ok) return NextResponse.json({ error: 'Te veel verzoeken' }, { status: 429 });

  try {
    const body = await req.json();
    const { planId, role, name, motivation, contribution } = body;

    if (!planId || typeof planId !== 'number') return NextResponse.json({ error: 'Ongeldig planId' }, { status: 400 });
    if (role !== 'kind' && role !== 'mogelijkmaker') return NextResponse.json({ error: 'Ongeldige rol' }, { status: 400 });
    if (!name?.trim() || !motivation?.trim() || !contribution?.trim()) return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 });
    if (name.length > 200 || motivation.length > 1000 || contribution.length > 1000) return NextResponse.json({ error: 'Tekst te lang' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase.from('helpers').insert({
      plan_id: planId,
      role: role,
      name: name.trim(),
      motivation: motivation.trim(),
      contribution: contribution.trim(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ helper: data });
  } catch {
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
