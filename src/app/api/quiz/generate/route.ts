import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getGeminiPro, isGeminiConfigured } from '@/lib/gemini';

// POST /api/quiz/generate — generate a quiz from a document using Gemini
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, userId = 'demo-user', difficulty = 'medium', topic, questionCount = 8 } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    let documentText = '';
    let documentName = 'Study Material';

    if (isSupabaseConfigured()) {
      const { data: doc } = await supabaseAdmin
        .from('documents')
        .select('name, page_count')
        .eq('id', documentId)
        .single();

      if (doc) documentName = doc.name;

      const { data: chunks } = await supabaseAdmin
        .from('document_chunks')
        .select('content')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });

      if (chunks) {
        documentText = chunks.map(c => c.content).join('\n\n');
      }
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(buildDemoQuiz(documentId, documentName, difficulty));
    }

    if (!documentText) {
      return NextResponse.json({ error: 'No document content found. Please process the document first.' }, { status: 404 });
    }

    const model = getGeminiPro();
    const textForQuiz = documentText.slice(0, 12000);

    const difficultyGuide = {
      easy: 'simple recall questions, basic definitions',
      medium: 'comprehension and application questions',
      hard: 'analysis, synthesis, and critical thinking questions',
    };

    const prompt = `You are an expert educational quiz creator. Create a comprehensive quiz from this study material.

DOCUMENT: ${documentName}
DIFFICULTY: ${difficulty} (${difficultyGuide[difficulty as keyof typeof difficultyGuide]})
${topic ? `FOCUS TOPIC: ${topic}` : ''}

CONTENT:
${textForQuiz}

Generate exactly ${questionCount} questions. Include a mix of:
- 6 Multiple Choice Questions (MCQ) with 4 options each
- 2 True/False questions

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "type": "mcq",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact text of the correct option",
    "explanation": "Brief explanation of why this is correct"
  },
  {
    "type": "true_false",
    "question": "Statement to evaluate as true or false.",
    "options": ["True", "False"],
    "correctAnswer": "True",
    "explanation": "Why this statement is true/false"
  }
]

Make questions progressively harder. Base ALL questions strictly on the provided content.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Clean up response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI quiz response. Please try again.' }, { status: 500 });
    }

    // Validate and clean questions
    const validQuestions = questions
      .filter((q: { question: string; type: string; correctAnswer: string }) => q.question && q.type && q.correctAnswer)
      .map((q: { type: string; question: string; options?: string[]; correctAnswer: string; explanation?: string }, i: number) => ({
        id: `temp-${i}`,
        type: q.type,
        question: q.question,
        options: q.options || ['True', 'False'],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'Refer to your study material for more details.',
        orderIndex: i,
      }));

    // Save quiz to database
    let quizId = `temp-${Date.now()}`;
    let finalQuestions = validQuestions;

    if (isSupabaseConfigured()) {
      const { data: quiz, error: quizError } = await supabaseAdmin
        .from('quizzes')
        .insert({
          user_id: userId,
          document_id: documentId,
          title: `${documentName.replace(/\.[^.]+$/, '')} Quiz`,
          topic,
          total_questions: validQuestions.length,
          difficulty,
        })
        .select()
        .single();

      if (!quizError && quiz) {
        quizId = quiz.id;

        // Insert questions and select them to retrieve IDs
        const { data: insertedQuestions, error: questionsError } = await supabaseAdmin
          .from('quiz_questions')
          .insert(
            validQuestions.map((q: any) => ({
              quiz_id: quizId,
              type: q.type,
              question: q.question,
              options: q.options,
              correct_answer: q.correctAnswer,
              explanation: q.explanation,
              order_index: q.orderIndex,
            }))
          )
          .select();

        if (!questionsError && insertedQuestions && insertedQuestions.length > 0) {
          finalQuestions = insertedQuestions.map((q: any) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            orderIndex: q.order_index,
          })).sort((a: any, b: any) => a.orderIndex - b.orderIndex);
        }
      }
    }

    return NextResponse.json({
      quizId,
      title: `${documentName.replace(/\.[^.]+$/, '')} — ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
      questions: finalQuestions,
      totalQuestions: finalQuestions.length,
      difficulty,
    });

  } catch (err) {
    console.error('Quiz generation error:', err);
    return NextResponse.json(
      { error: 'Quiz generation failed', details: String(err) },
      { status: 500 }
    );
  }
}

function buildDemoQuiz(documentId: string, documentName: string, difficulty: string) {
  const questions = [
    {
      type: 'mcq', orderIndex: 0,
      question: 'What is the primary pigment used in photosynthesis?',
      options: ['Carotenoid', 'Chlorophyll', 'Anthocyanin', 'Phycoerythrin'],
      correctAnswer: 'Chlorophyll',
      explanation: 'Chlorophyll is the main photosynthetic pigment that absorbs light energy in plants.'
    },
    {
      type: 'mcq', orderIndex: 1,
      question: 'Where do the light-dependent reactions of photosynthesis occur?',
      options: ['Stroma', 'Thylakoid membrane', 'Outer membrane', 'Matrix'],
      correctAnswer: 'Thylakoid membrane',
      explanation: 'The light-dependent reactions occur in the thylakoid membranes of the chloroplast.'
    },
    {
      type: 'true_false', orderIndex: 2,
      question: 'Oxygen is a byproduct of the light-dependent reactions of photosynthesis.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Oxygen is released when water is split during the light reactions (photolysis).'
    },
    {
      type: 'mcq', orderIndex: 3,
      question: 'What enzyme is responsible for carbon fixation in the Calvin cycle?',
      options: ['ATP synthase', 'NADPH reductase', 'RuBisCO', 'Glucose-6-phosphatase'],
      correctAnswer: 'RuBisCO',
      explanation: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase/oxygenase) fixes CO₂ in the Calvin cycle.'
    },
    {
      type: 'true_false', orderIndex: 4,
      question: 'The Calvin cycle requires direct sunlight to function.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'The Calvin cycle does not directly require light; it uses ATP and NADPH from the light reactions.'
    },
    {
      type: 'mcq', orderIndex: 5,
      question: 'What is the overall equation for photosynthesis?',
      options: [
        'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O',
        '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
        '6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂',
        'CO₂ + H₂O → Glucose + O₂'
      ],
      correctAnswer: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
      explanation: 'Photosynthesis converts CO₂ and H₂O into glucose and O₂ using light energy.'
    },
    {
      type: 'mcq', orderIndex: 6,
      question: 'Which wavelengths does chlorophyll absorb most effectively?',
      options: ['Green and yellow', 'Red and blue-violet', 'Orange and ultraviolet', 'White and infrared'],
      correctAnswer: 'Red and blue-violet',
      explanation: 'Chlorophyll reflects green light (making plants appear green) and absorbs red (~680nm) and blue-violet (~430nm).'
    },
    {
      type: 'true_false', orderIndex: 7,
      question: 'The stroma is the fluid-filled space surrounding the thylakoids inside the chloroplast.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'The stroma is the aqueous fluid in the chloroplast where the Calvin cycle takes place.'
    },
  ];

  return {
    quizId: `demo-${documentId}`,
    title: `${documentName.replace(/\.[^.]+$/, '')} — ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
    questions,
    totalQuestions: questions.length,
    difficulty,
    demo: true,
    message: 'Add GEMINI_API_KEY in .env.local for AI-generated quizzes from your actual documents',
  };
}
