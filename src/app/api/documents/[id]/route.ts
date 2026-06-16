import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// DELETE /api/documents/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Demo mode: document deleted (simulated)' });
  }

  // Delete from storage
  const { data: doc } = await supabaseAdmin
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single();

  if (doc?.file_url) {
    const path = doc.file_url.split('/storage/v1/object/public/documents/')[1];
    if (path) {
      await supabaseAdmin.storage.from('documents').remove([path]);
    }
  }

  // Delete record (cascades to chunks)
  const { error } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Document deleted' });
}

// GET /api/documents/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: { id, name: 'Demo Document', status: 'ready', page_count: 24 } });
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
}
