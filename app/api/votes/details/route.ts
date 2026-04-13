import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getServiceClient();

  // Get all voters with their votes
  const { data: voters } = await supabase
    .from('voters')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: votes } = await supabase
    .from('votes')
    .select('*');

  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, budget, poster_url, status');

  // Build totals per plan
  const totals: Record<number, number> = {};
  (votes || []).forEach((v: { plan_id: number; keys: number }) => {
    totals[v.plan_id] = (totals[v.plan_id] || 0) + v.keys;
  });

  // Build voter details with their votes
  const voterDetails = (voters || []).map((voter: {
    id: string; first_name: string; last_name: string;
    date_of_birth: string; group_name: string; total_keys: number; created_at: string;
  }) => {
    const voterVotes = (votes || [])
      .filter((v: { voter_id: string }) => v.voter_id === voter.id)
      .map((v: { plan_id: number; keys: number }) => {
        const plan = (plans || []).find((p: { id: number }) => p.id === v.plan_id);
        return { plan_id: v.plan_id, plan_name: plan?.name || '?', keys: v.keys };
      })
      .sort((a: { keys: number }, b: { keys: number }) => b.keys - a.keys);

    return { ...voter, votes: voterVotes };
  });

  return NextResponse.json({
    voters: voterDetails,
    totals,
    plans: (plans || []).filter((p: { status?: string }) => p.status === 'door_naar_slotdag'),
    voter_count: (voters || []).length,
  });
}
