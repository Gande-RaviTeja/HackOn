import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getGeminiFlash, isGeminiConfigured } from '@/lib/gemini';

// GET /api/dashboard — get aggregated stats and recommendations
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!isSupabaseConfigured()) {
    return NextResponse.json(getDemoStats());
  }

  try {
    // Parallel fetch all stats
    const [
      docsResult,
      chatsResult,
      quizzesResult,
      attemptsResult,
      statsResult,
    ] = await Promise.all([
      supabaseAdmin.from('documents').select('id', { count: 'exact' }).eq('user_id', userId),
      supabaseAdmin.from('chat_sessions').select('id', { count: 'exact' }).eq('user_id', userId),
      supabaseAdmin.from('quizzes').select('id', { count: 'exact' }).eq('user_id', userId),
      supabaseAdmin.from('quiz_attempts').select('score').eq('user_id', userId).order('completed_at', { ascending: false }).limit(20),
      supabaseAdmin.from('learning_stats').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(30),
    ]);

    const totalDocuments = docsResult.count || 0;
    const totalChats = chatsResult.count || 0;
    const totalQuizzes = quizzesResult.count || 0;

    const attempts = attemptsResult.data || [];
    const averageScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0;

    const stats = statsResult.data || [];
    const totalStudyMinutes = stats.reduce((sum, s) => sum + (s.study_minutes || 0), 0);

    // Calculate streak
    const studyStreak = calculateStreak(stats);

    // Build chart data
    const studyMinutesByDay = stats.slice(0, 7).reverse().map(s => ({
      day: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: s.study_minutes || 0,
    }));

    // Fetch recent activity
    const { data: recentDocs } = await supabaseAdmin
      .from('documents')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    const recentActivity = (recentDocs || []).map(d => ({
      type: 'upload',
      title: `Uploaded "${d.name}"`,
      description: 'Document ready for AI chat',
      timestamp: d.created_at,
    }));

    // AI recommendations
    let recommendations = [];
    if (isGeminiConfigured() && totalDocuments > 0) {
      try {
        recommendations = await generateRecommendations(userId);
      } catch {
        recommendations = getDemoRecommendations();
      }
    } else {
      recommendations = getDemoRecommendations();
    }

    return NextResponse.json({
      totalDocuments,
      totalChats,
      totalQuizzes,
      averageScore,
      studyStreak,
      totalStudyMinutes,
      recentActivity,
      studyMinutesByDay: studyMinutesByDay.length > 0 ? studyMinutesByDay : getDemoStudyData(),
      quizScores: attempts.slice(0, 5).map((a, i) => ({ date: `Quiz ${i + 1}`, score: a.score })),
      recommendations,
    });

  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json(getDemoStats());
  }
}

function calculateStreak(stats: { date: string }[]): number {
  if (!stats.length) return 0;
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = today;

  for (const stat of stats) {
    if (stat.date === currentDate) {
      streak++;
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      currentDate = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
}

async function generateRecommendations(userId: string): Promise<{ topic: string; reason: string; documentName: string; documentId: string; priority: string }[]> {
  const { data: attempts } = await supabaseAdmin
    .from('quiz_attempts')
    .select('quiz_id, score, quizzes(document_id, documents(name))')
    .eq('user_id', userId)
    .lt('score', 70)
    .limit(3);

  return (attempts || []).map((a: any) => {
    const quiz = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
    const document = quiz ? (Array.isArray(quiz.documents) ? quiz.documents[0] : quiz.documents) : null;
    return {
      topic: 'Review needed',
      reason: `Low quiz score: ${a.score}%`,
      documentName: document?.name || 'Unknown',
      documentId: quiz?.document_id || '',
      priority: a.score < 50 ? 'high' : 'medium',
    };
  });
}

function getDemoRecommendations() {
  return [
    { topic: 'Photosynthesis', reason: 'Scored below 70% on related questions', documentName: 'Biology Chapter 5', documentId: '1', priority: 'high' },
    { topic: 'Kinematics', reason: 'Not reviewed in 3 days', documentName: 'Physics Formulas', documentId: '2', priority: 'medium' },
    { topic: 'World War II Causes', reason: 'Upcoming exam topic', documentName: 'History Notes', documentId: '3', priority: 'low' },
  ];
}

function getDemoStudyData() {
  return [
    { day: 'Mon', minutes: 45 },
    { day: 'Tue', minutes: 90 },
    { day: 'Wed', minutes: 30 },
    { day: 'Thu', minutes: 120 },
    { day: 'Fri', minutes: 75 },
    { day: 'Sat', minutes: 150 },
    { day: 'Sun', minutes: 60 },
  ];
}

function getDemoStats() {
  return {
    totalDocuments: 12,
    totalChats: 47,
    totalQuizzes: 28,
    averageScore: 81,
    studyStreak: 7,
    totalStudyMinutes: 2850,
    recentActivity: [
      { type: 'upload', title: 'Uploaded "Biology Chapter 5.pdf"', description: 'Ready for AI chat', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { type: 'quiz', title: 'Scored 91% on History Quiz', description: 'Great performance!', timestamp: new Date(Date.now() - 14400000).toISOString() },
      { type: 'chat', title: 'Asked 12 AI questions', description: 'Physics study session', timestamp: new Date(Date.now() - 86400000).toISOString() },
    ],
    studyMinutesByDay: getDemoStudyData(),
    quizScores: [
      { date: 'Biology', score: 85 },
      { date: 'Math', score: 72 },
      { date: 'History', score: 91 },
      { date: 'Physics', score: 68 },
      { date: 'Chemistry', score: 88 },
    ],
    recommendations: getDemoRecommendations(),
    demo: true,
  };
}
