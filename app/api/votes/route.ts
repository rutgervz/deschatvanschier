import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, dob, group, votes } = body;

    if (!firstName || !lastName || !dob || !group || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json({ error: 'Vul alle velden in' }, { status: 400 });
    }

    const totalKeys = votes.reduce((sum: number, v: { keys: number }) => sum + v.keys, 0);
    if (totalKeys > 10 || totalKeys < 1) {
      return NextResponse.json({ error: 'Ongeldig aantal sleutels' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Create voter record
    const { data: voter, error: voterErr } = await supabase.from('voters').insert({
      first_name: firstName.trim().slice(0, 100),
      last_name: lastName.trim().slice(0, 100),
      date_of_birth: dob,
      group_name: group.slice(0, 50),
      total_keys: totalKeys,
    }).select('id').single();

    if (voterErr || !voter) {
      return NextResponse.json({ error: 'Kon stemmer niet opslaan' }, { status: 500 });
    }

    // Insert individual votes
    const voteRows = votes.map((v: { plan_id: number; keys: number }) => ({
      voter_id: voter.id,
      plan_id: v.plan_id,
      keys: Math.min(Math.max(v.keys, 1), 10),
    }));

    const { error: voteErr } = await supabase.from('votes').insert(voteRows);
    if (voteErr) {
      return NextResponse.json({ error: 'Kon stemmen niet opslaan' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
