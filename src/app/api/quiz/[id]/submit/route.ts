import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// POST /api/quiz/[id]/submit — submit quiz attempt and save score
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { answers, userId = 'demo-user', timeTaken = 0 } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers object is required' }, { status: 400 });
    }

    if (!isSupabaseConfigured() || id.startsWith('demo-') || id.startsWith('temp-')) {
      // Demo mode: calculate score locally
      return NextResponse.json({
        message: 'Quiz submitted (demo mode)',
        score: 0,
        demo: true,
      });
    }

    // Fetch questions to calculate score
    const { data: questions, error: qError } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, correct_answer')
      .eq('quiz_id', id);

    if (qError || !questions) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] && answers[q.id].trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
        correctCount++;
      }
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    // Save attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: id,
        user_id: userId,
        score,
        total_questions: questions.length,
        answers,
        time_taken: timeTaken,
      })
      .select()
      .single();

    if (attemptError) {
      return NextResponse.json({ error: attemptError.message }, { status: 500 });
    }

    // Update learning stats
    await supabaseAdmin
      .from('learning_stats')
      .upsert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        quizzes_taken: 1,
      }, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false,
      })
      .catch(console.error);

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      correctCount,
      totalQuestions: questions.length,
      timeTaken,
    });

  } catch (err) {
    console.error('Quiz submit error:', err);
    return NextResponse.json(
      { error: 'Quiz submission failed', details: String(err) },
      { status: 500 }
    );
  }
}
