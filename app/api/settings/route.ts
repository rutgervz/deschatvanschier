import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getServiceClient();
  const { data } = await supabase.from('site_settings').select('*');
  const settings: Record<string, string> = {};
  (data || []).forEach((row: { key: string; value: string }) => { settings[row.key] = row.value; });
  return NextResponse.json({ settings });
}
