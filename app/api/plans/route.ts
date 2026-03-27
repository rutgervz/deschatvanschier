import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function GET() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans: data || [] });
}
