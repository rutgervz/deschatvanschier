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

  // planId is now required
  if (!planId) {
    return NextResponse.json({ error: 'planId is verplicht' }, { status: 400 });
  }

  const parsed = parseInt(planId);
  if (isNaN(parsed)) {
    return NextResponse.json({ error: 'Ongeldig planId' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('enrichments')
    .select('*')
    .eq('plan_id', parsed)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ enrichments: data });
}

// DELETE endpoint removed for security — enrichments can only be created via chat
