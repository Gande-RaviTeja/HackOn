import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { embedText, isGeminiConfigured } from '@/lib/gemini';
import { chunkText } from '@/lib/utils';

// POST /api/documents/[id]/process
// Parses PDF, chunks text, embeds with Gemini, stores in Supabase
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { fileUrl, fileType } = body;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ message: 'Demo mode — processing simulated' });
    }

    // Mark as processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', id);

    // Download file from Supabase Storage
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    // Parse text based on file type
    let fullText = '';
    let pageCount = 1;

    if (fileType === 'application/pdf' || fileUrl.endsWith('.pdf')) {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(fileBuffer);
        fullText = pdfData.text;
        pageCount = pdfData.numpages;
      } catch {
        // Fallback: treat as plain text
        fullText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
      }
    } else {
      // DOCX — basic text extraction
      fullText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
    }

    if (!fullText || fullText.trim().length < 10) {
      throw new Error('Could not extract text from document');
    }

    // Chunk the text (512 words per chunk, 50-word overlap)
    const chunks = chunkText(fullText, 512, 50);

    // Generate embeddings and store chunks
    const chunksToInsert = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.trim().length < 20) continue;

      let embedding: number[] | null = null;

      if (isGeminiConfigured()) {
        try {
          embedding = await embedText(chunk);
        } catch (err) {
          console.error(`Embedding error for chunk ${i}:`, err);
        }
      }

      chunksToInsert.push({
        document_id: id,
        content: chunk,
        page_number: Math.ceil((i + 1) / Math.max(1, Math.ceil(chunks.length / pageCount))),
        chunk_index: i,
        embedding: embedding,
      });

      // Small delay to avoid rate limiting
      if (i % 10 === 9) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Batch insert chunks
    if (chunksToInsert.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < chunksToInsert.length; i += batchSize) {
        const batch = chunksToInsert.slice(i, i + batchSize);
        const { error } = await supabaseAdmin
          .from('document_chunks')
          .insert(batch);
        if (error) throw error;
      }
    }

    // Generate a quick AI summary if Gemini is configured
    let summary: string | undefined;
    if (isGeminiConfigured()) {
      try {
        const { getGeminiFlash } = await import('@/lib/gemini');
        const model = getGeminiFlash();
        const previewText = fullText.slice(0, 3000);
        const result = await model.generateContent(
          `Summarize this document in 2-3 sentences for a student. Be concise and focus on the main topics covered:\n\n${previewText}`
        );
        summary = result.response.text().trim();
      } catch (err) {
        console.error('Summary generation failed:', err);
      }
    }

    // Mark as ready
    await supabaseAdmin
      .from('documents')
      .update({
        status: 'ready',
        page_count: pageCount,
        summary: summary || `Document processed successfully. ${chunks.length} sections indexed for AI search.`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      message: 'Document processed successfully',
      chunks: chunksToInsert.length,
      pages: pageCount,
      hasEmbeddings: isGeminiConfigured(),
    });

  } catch (err) {
    console.error('Document processing error:', err);

    // Mark as error
    if (isSupabaseConfigured()) {
      await supabaseAdmin
        .from('documents')
        .update({ status: 'error' })
        .eq('id', id);
    }

    return NextResponse.json(
      { error: 'Processing failed', details: String(err) },
      { status: 500 }
    );
  }
}
