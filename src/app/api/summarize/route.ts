import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getGeminiFlash, isGeminiConfigured } from '@/lib/gemini';

// POST /api/summarize — generate AI summary of a document
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, userId = 'demo-user' } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Get document content from chunks
    let documentText = '';
    let documentName = 'Document';
    let pageCount = 1;

    if (isSupabaseConfigured()) {
      // Fetch document info
      const { data: doc } = await supabaseAdmin
        .from('documents')
        .select('name, page_count, summary')
        .eq('id', documentId)
        .single();

      if (doc) {
        documentName = doc.name;
        pageCount = doc.page_count || 1;

        // Return cached summary if exists and no real AI
        if (doc.summary && !isGeminiConfigured()) {
          return NextResponse.json(buildDemoSummary(documentName, pageCount));
        }
      }

      // Fetch all chunks for this document
      const { data: chunks } = await supabaseAdmin
        .from('document_chunks')
        .select('content, page_number')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });

      if (chunks && chunks.length > 0) {
        documentText = chunks.map(c => c.content).join('\n\n');
      }
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(buildDemoSummary(documentName, pageCount));
    }

    if (!documentText) {
      return NextResponse.json({ error: 'No document content found. Please process the document first.' }, { status: 404 });
    }

    const model = getGeminiFlash();

    // Limit text to avoid token limits
    const textForSummary = documentText.slice(0, 15000);

    const prompt = `You are an expert educational content analyzer. Analyze this study document and provide a comprehensive structured summary.

DOCUMENT: ${documentName}

CONTENT:
${textForSummary}

Return your response as a valid JSON object with exactly this structure:
{
  "overview": "2-3 sentence overview of the entire document",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5", "point 6"],
  "sections": [
    {
      "title": "Section Title",
      "pages": "1-5",
      "summary": "Brief summary of this section"
    }
  ],
  "definitions": [
    {
      "term": "Term",
      "definition": "Clear definition suitable for a student"
    }
  ]
}

Include 4-6 key points, 3-5 sections, and 4-8 important definitions. Be educational and student-focused.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Extract JSON from markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      responseText = jsonMatch[1].trim();
    }

    let summaryData;
    try {
      summaryData = JSON.parse(responseText);
    } catch {
      // If JSON parse fails, build structured response from plain text
      summaryData = {
        overview: responseText.slice(0, 300),
        keyPoints: ['Key concepts from the document have been analyzed', 'Refer to your document for specific details'],
        sections: [{ title: documentName, pages: `1-${pageCount}`, summary: responseText.slice(0, 200) }],
        definitions: [],
      };
    }

    // Cache summary in document record
    if (isSupabaseConfigured()) {
      await supabaseAdmin
        .from('documents')
        .update({ summary: summaryData.overview })
        .eq('id', documentId);
    }

    return NextResponse.json({
      title: documentName,
      pageCount,
      readingTime: `~${Math.ceil(pageCount * 2.5)} min`,
      ...summaryData,
    });

  } catch (err) {
    console.error('Summarize API error:', err);
    return NextResponse.json(
      { error: 'Summarization failed', details: String(err) },
      { status: 500 }
    );
  }
}

function buildDemoSummary(name: string, pageCount: number) {
  return {
    title: name,
    pageCount,
    readingTime: `~${Math.ceil(pageCount * 2.5)} min`,
    overview: `This document covers the core concepts of the subject matter across ${pageCount} pages. It provides detailed explanations, examples, and key principles that are essential for academic understanding and exam preparation.`,
    keyPoints: [
      'Fundamental concepts and principles are introduced with clear definitions',
      'Step-by-step explanations help build understanding progressively',
      'Real-world applications and examples are provided throughout',
      'Key formulas, equations, and relationships are highlighted',
      'Summary points at the end of each section reinforce learning',
      'Practice questions are integrated to test comprehension',
    ],
    sections: [
      { title: 'Introduction & Overview', pages: '1-4', summary: 'Introduces the main topic, its importance, and provides background context for the study material.' },
      { title: 'Core Concepts', pages: '5-12', summary: 'Covers the fundamental principles, definitions, and theoretical framework of the subject.' },
      { title: 'Detailed Analysis', pages: '13-20', summary: 'In-depth examination of key processes, mechanisms, and relationships between concepts.' },
      { title: 'Applications & Examples', pages: '21-24', summary: 'Practical applications, worked examples, and case studies to reinforce understanding.' },
    ],
    definitions: [
      { term: 'Core Concept', definition: 'The fundamental idea or principle that forms the basis of the subject being studied.' },
      { term: 'Mechanism', definition: 'The specific process or system by which a phenomenon occurs or operates.' },
      { term: 'Application', definition: 'The practical use or implementation of theoretical knowledge in real-world scenarios.' },
      { term: 'Analysis', definition: 'A detailed examination of the components of a subject to understand its structure and function.' },
    ],
    demo: true,
    message: 'Add GEMINI_API_KEY in .env.local for real AI-generated summaries from your documents',
  };
}
