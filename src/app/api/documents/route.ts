import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/documents — list all documents for a user
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!isSupabaseConfigured()) {
    // Return mock data in demo mode
    return NextResponse.json({
      data: [
        { id: '1', name: 'Biology Chapter 5 - Photosynthesis.pdf', file_size: 2400000, file_type: 'pdf', status: 'ready', page_count: 24, created_at: new Date(Date.now() - 7200000).toISOString(), summary: 'Covers light and dark reactions, chlorophyll, and photosynthesis stages.' },
        { id: '2', name: 'Physics Formulas and Laws.pdf', file_size: 1800000, file_type: 'pdf', status: 'ready', page_count: 18, created_at: new Date(Date.now() - 86400000).toISOString(), summary: 'Newton\'s laws, kinematics, thermodynamics formulas.' },
        { id: '3', name: 'History Notes - World War II.pdf', file_size: 3200000, file_type: 'pdf', status: 'ready', page_count: 32, created_at: new Date(Date.now() - 172800000).toISOString(), summary: 'Causes, key events, turning points, and aftermath of WWII.' },
        { id: '4', name: 'Mathematics - Calculus.pdf', file_size: 4100000, file_type: 'pdf', status: 'ready', page_count: 45, created_at: new Date(Date.now() - 259200000).toISOString(), summary: 'Limits, derivatives, integrals, and differential equations.' },
      ]
    });
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/documents — upload a new document
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || 'demo-user';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      // Demo mode: return fake document
      const fakeDoc = {
        id: `demo-${Date.now()}`,
        name: file.name,
        file_url: '#',
        file_size: file.size,
        file_type: file.type.includes('pdf') ? 'pdf' : 'docx',
        status: 'processing',
        page_count: 0,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ data: fakeDoc, demo: true });
    }

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Insert document record
    const { data: doc, error: insertError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: userId,
        name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type.includes('pdf') ? 'pdf' : 'docx',
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Trigger processing (async — don't wait)
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/documents/${doc.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl: urlData.publicUrl, fileType: file.type }),
    }).catch(console.error);

    return NextResponse.json({ data: doc });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed', details: String(err) }, { status: 500 });
  }
}
