import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// POST /api/sessions — create a new chat session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'demo-user', documentId } = body;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        data: {
          id: `demo-session-${Date.now()}`,
          user_id: userId,
          document_id: documentId,
          title: 'New Chat',
          created_at: new Date().toISOString(),
        }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: userId,
        document_id: documentId || null,
        title: 'New Chat',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/sessions — list chat sessions for user
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .select('*, documents(name)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
