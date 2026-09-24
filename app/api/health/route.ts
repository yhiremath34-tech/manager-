import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Perform a lightweight test query against Supabase
    const { data, error } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Health Check] Supabase query error:', error);
      return NextResponse.json(
        {
          status: 'error',
          supabase: 'disconnected',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        supabase: 'connected',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Health Check] Unexpected error:', err);
    return NextResponse.json(
      {
        status: 'error',
        supabase: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
