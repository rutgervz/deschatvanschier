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
    .from('tips')
    .select('*')
    .eq('plan_id', parsed)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tips: data || [] });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(ip, 'general');
  if (!limit.ok) return NextResponse.json({ error: 'Te veel verzoeken' }, { status: 429 });

  try {
    const body = await req.json();
    const { planId, name, reason, tip } = body;

    if (!planId || typeof planId !== 'number') return NextResponse.json({ error: 'Ongeldig planId' }, { status: 400 });
    if (!name?.trim() || !reason?.trim() || !tip?.trim()) return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 });
    if (name.length > 200 || reason.length > 1000 || tip.length > 1000) return NextResponse.json({ error: 'Tekst te lang' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase.from('tips').insert({
      plan_id: planId,
      name: name.trim(),
      reason: reason.trim(),
      tip: tip.trim(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tip: data });
  } catch {
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
