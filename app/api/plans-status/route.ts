import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('plans')
    .select('id, active_budget, active_tier, active_costs_label')
    .not('active_budget', 'eq', '');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans: data || [] });
}
