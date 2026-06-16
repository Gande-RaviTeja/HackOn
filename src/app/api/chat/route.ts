import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { embedText, getGeminiFlash, isGeminiConfigured } from '@/lib/gemini';

// POST /api/chat
// RAG-powered chat: embed question → vector search → Gemini answer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, documentId, sessionId, userId = 'demo-user', history = [] } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Demo mode fallback
    if (!isGeminiConfigured()) {
      const demoAnswer = getDemoAnswer(question);
      return NextResponse.json({
        answer: demoAnswer.text,
        citations: demoAnswer.citations,
        demo: true,
        message: 'Demo mode: Add your GEMINI_API_KEY in .env.local for real AI responses',
      });
    }

    let contextChunks: { content: string; page_number: number; similarity: number }[] = [];

    // RAG: retrieve relevant chunks from vector DB
    if (documentId && isSupabaseConfigured()) {
      try {
        const queryEmbedding = await embedText(question);

        const { data: chunks, error } = await supabaseAdmin.rpc('match_document_chunks', {
          query_embedding: queryEmbedding,
          match_document_id: documentId,
          match_count: 5,
        });

        if (!error && chunks) {
          contextChunks = chunks.filter((c: { similarity: number }) => c.similarity > 0.3);
        }
      } catch (err) {
        console.error('Vector search error:', err);
      }
    }

    // Build the prompt
    const systemPrompt = `You are LearnSphere AI, an expert educational assistant helping students understand their study materials.

Your role:
- Answer questions clearly and accurately based on the provided context
- Use simple language appropriate for students
- Structure answers with bullet points or numbered lists when helpful
- Always cite which parts of the document you used (mention page numbers if available)
- If the question is not covered in the context, say so and provide general knowledge
- Be encouraging and supportive

${contextChunks.length > 0 ? `
DOCUMENT CONTEXT (use this to answer):
${contextChunks.map((c, i) => `[Chunk ${i + 1} - Page ${c.page_number}]:\n${c.content}`).join('\n\n---\n\n')}
` : 'No specific document context available. Provide a helpful general answer.'}`;

    const model = getGeminiFlash();
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m LearnSphere AI and I\'m ready to help students learn from their materials. I\'ll provide clear, accurate answers based on the document context provided.' }],
        },
        // Include recent conversation history
        ...history.slice(-6).map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(question);
    const answer = result.response.text();

    // Build citations from context chunks
    const citations = contextChunks.slice(0, 3).map(chunk => ({
      pageNumber: chunk.page_number,
      excerpt: chunk.content.slice(0, 150) + (chunk.content.length > 150 ? '...' : ''),
      similarity: Math.round(chunk.similarity * 100),
    }));

    // Save message to DB
    if (sessionId && isSupabaseConfigured()) {
      await supabaseAdmin.from('chat_messages').insert([
        { session_id: sessionId, role: 'user', content: question },
        { session_id: sessionId, role: 'assistant', content: answer, citations },
      ]);

      // Update session timestamp
      await supabaseAdmin
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Update learning stats
      try {
        await supabaseAdmin.rpc('increment_stat', {
          p_user_id: userId,
          p_field: 'messages_count',
          p_amount: 1,
        });
      } catch {
        // ignore if function doesn't exist
      }
    }

    return NextResponse.json({ answer, citations });

  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'AI chat failed', details: String(err) },
      { status: 500 }
    );
  }
}

// GET /api/chat — get chat history for a session
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId || !isSupabaseConfigured()) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// Demo mode responses
function getDemoAnswer(question: string): { text: string; citations: { pageNumber: number; excerpt: string }[] } {
  const q = question.toLowerCase();

  if (q.includes('photosynthesis') || q.includes('chlorophyll') || q.includes('plant')) {
    return {
      text: `**Photosynthesis** is the process by which plants convert light energy into chemical energy stored as glucose.\n\n**The two main stages are:**\n\n1. **Light-Dependent Reactions** (in thylakoid membranes)\n   - Chlorophyll absorbs sunlight\n   - Water molecules are split (photolysis)\n   - ATP and NADPH are produced\n   - Oxygen is released as a byproduct\n\n2. **Calvin Cycle** (in stroma)\n   - CO₂ is fixed by RuBisCO enzyme\n   - Glucose (C₆H₁₂O₆) is synthesized\n\n**Overall equation:**\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂`,
      citations: [
        { pageNumber: 5, excerpt: 'Chlorophyll molecules absorb photons of light, primarily in the red and blue-violet wavelengths, initiating the light reactions...' },
        { pageNumber: 8, excerpt: 'The Calvin cycle uses the ATP and NADPH produced in the light reactions to reduce CO₂ into organic compounds...' },
      ]
    };
  }

  if (q.includes('newton') || q.includes('motion') || q.includes('force')) {
    return {
      text: `**Newton's Three Laws of Motion:**\n\n**1st Law (Inertia):** An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.\n\n**2nd Law (F = ma):** The acceleration of an object is directly proportional to the net force and inversely proportional to its mass.\n- **Formula:** F = ma (Force = Mass × Acceleration)\n\n**3rd Law (Action-Reaction):** For every action, there is an equal and opposite reaction.\n\nThese laws form the foundation of classical mechanics and explain most everyday physical phenomena.`,
      citations: [
        { pageNumber: 3, excerpt: 'Newton\'s first law, also known as the law of inertia, states that a body continues in its state of rest or uniform motion...' },
        { pageNumber: 4, excerpt: 'The mathematical relationship F=ma quantifies how force, mass, and acceleration are interrelated...' },
      ]
    };
  }

  return {
    text: `Great question about **"${question}"**!\n\nBased on your uploaded study materials, here's what's relevant:\n\n• This topic is covered in multiple sections of your documents\n• The key concepts relate to the fundamental principles you're studying\n• For exam preparation, focus on definitions, formulas, and applications\n\n💡 **To get real AI-powered answers from your documents:**\n1. Add your Gemini API key in Settings\n2. The AI will search through your actual document content\n3. You'll get precise answers with page citations\n\nWould you like me to:\n- Generate a quiz on this topic?\n- Create a summary of related sections?\n- Explain a specific sub-concept in more detail?`,
    citations: []
  };
}
