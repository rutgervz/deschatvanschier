import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(ip, 'general');
  if (!limit.ok) {
    return NextResponse.json({ error: 'Te veel verzoeken' }, { status: 429 });
  }

  const planId = req.nextUrl.searchParams.get('planId');
  if (!planId) return NextResponse.json({ error: 'planId is verplicht' }, { status: 400 });

  const parsed = parseInt(planId);
  if (isNaN(parsed)) return NextResponse.json({ error: 'Ongeldig planId' }, { status: 400 });

  const supabase = getServiceClient();

  const { data: versions } = await supabase
    .from('cost_versions')
    .select('*')
    .eq('plan_id', parsed)
    .order('version_number', { ascending: true });

  const { data: items } = await supabase
    .from('cost_items')
    .select('*')
    .eq('plan_id', parsed)
    .order('sort_order');

  return NextResponse.json({ versions: versions || [], items: items || [] });
}

// PATCH removed — version switching now only happens via activate-budget endpoint
