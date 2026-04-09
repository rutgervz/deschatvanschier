import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getServiceClient();
  const { data } = await supabase.from('votes').select('plan_id, keys');

  const totals: Record<number, number> = {};
  (data || []).forEach((row: { plan_id: number; keys: number }) => {
    totals[row.plan_id] = (totals[row.plan_id] || 0) + row.keys;
  });

  return NextResponse.json({ totals });
}
