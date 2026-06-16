'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

type QuestionType = 'mcq' | 'true_false';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

const demoQuiz: Question[] = [
  {
    id: 'demo-1', type: 'mcq',
    question: 'What is the primary pigment used in photosynthesis?',
    options: ['Carotenoid', 'Chlorophyll', 'Anthocyanin', 'Phycoerythrin'],
    correctAnswer: 'Chlorophyll',
    explanation: 'Chlorophyll is the primary photosynthetic pigment found in plants. It absorbs light mainly in the red and blue-violet wavelengths.'
  },
  {
    id: 'demo-2', type: 'mcq',
    question: 'In which part of the chloroplast do the light-dependent reactions occur?',
    options: ['Stroma', 'Thylakoid membrane', 'Outer membrane', 'Matrix'],
    correctAnswer: 'Thylakoid membrane',
    explanation: 'The light-dependent reactions (light reactions) occur in the thylakoid membranes, where chlorophyll captures light energy.'
  },
  {
    id: 'demo-3', type: 'true_false',
    question: 'Oxygen is a byproduct of the light-dependent reactions of photosynthesis.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'Correct! Oxygen is released when water molecules are split (photolysis) during the light-dependent reactions.'
  },
  {
    id: 'demo-4', type: 'mcq',
    question: 'What molecule is used to fix CO₂ in the Calvin cycle?',
    options: ['ATP', 'NADPH', 'RuBisCO', 'Glucose'],
    correctAnswer: 'RuBisCO',
    explanation: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase/oxygenase) is the enzyme responsible for carbon fixation in the Calvin cycle.'
  },
  {
    id: 'demo-5', type: 'true_false',
    question: 'The Calvin cycle requires direct sunlight to function.',
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanation: 'The Calvin cycle (light-independent reactions) does not directly require light. It uses ATP and NADPH produced by the light reactions.'
  },
  {
    id: 'demo-6', type: 'mcq',
    question: 'What is the overall chemical equation for photosynthesis?',
    options: [
      'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O',
      '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
      '6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂',
      'C₆H₁₂O₆ + O₂ → CO₂ + H₂O + energy'
    ],
    correctAnswer: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    explanation: 'Photosynthesis converts carbon dioxide and water into glucose and oxygen using light energy.'
  },
  {
    id: 'demo-7', type: 'mcq',
    question: 'Which wavelengths of light are most effectively absorbed by chlorophyll?',
    options: ['Green and yellow', 'Red and blue-violet', 'Orange and ultraviolet', 'Infrared and white'],
    correctAnswer: 'Red and blue-violet',
    explanation: 'Chlorophyll a and b absorb light most effectively in the red (~680nm) and blue-violet (~430nm) wavelengths.'
  },
  {
    id: 'demo-8', type: 'true_false',
    question: 'The stroma is the aqueous fluid surrounding the thylakoids inside the chloroplast.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'Correct! The stroma is the fluid-filled space of the chloroplast, where the Calvin cycle takes place.'
  },
];

type QuizState = 'setup' | 'active' | 'results';

export default function QuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedDoc = searchParams.get('doc');

  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [selectedDoc, setSelectedDoc] = useState(preselectedDoc || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [topic, setTopic] = useState<string>('');
  
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [error, setError] = useState('');

  // Results
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/documents', { headers: { 'x-user-id': user?.id || '' } })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          const readyDocs = data.data.filter((d: { status: string }) => d.status === 'ready');
          if (readyDocs.length > 0) {
            setDocuments(readyDocs);
            if (!preselectedDoc) {
              setSelectedDoc(readyDocs[0].id);
            }
          } else {
            const fallbackDocs = [
              { id: '1', name: 'Biology Chapter 5 - Photosynthesis.pdf' },
              { id: '2', name: 'Physics Formulas and Laws.pdf' },
              { id: '3', name: 'History Notes - World War II.pdf' },
              { id: '4', name: 'Mathematics - Calculus.pdf' },
            ];
            setDocuments(fallbackDocs);
            if (!preselectedDoc) {
              setSelectedDoc('1');
            }
          }
        }
      })
      .catch(() => {
        const fallbackDocs = [
          { id: '1', name: 'Biology Chapter 5 - Photosynthesis.pdf' },
          { id: '2', name: 'Physics Formulas and Laws.pdf' },
          { id: '3', name: 'History Notes - World War II.pdf' },
          { id: '4', name: 'Mathematics - Calculus.pdf' },
        ];
        setDocuments(fallbackDocs);
        if (!selectedDoc) {
          setSelectedDoc('1');
        }
      });
  }, [preselectedDoc, user, selectedDoc]);

  const handleGenerateQuiz = async () => {
    if (!selectedDoc) {
      setError('Please select a document first');
      return;
    }
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDoc,
          userId: user?.id || 'demo-user',
          difficulty,
          questionCount,
          topic: topic.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quiz generation failed');

      setQuizId(data.quizId);
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setAnswers({});
      setSelectedAnswer('');
      setShowExplanation(false);
      setScore(null);
      setCorrectCount(null);
      setStartTime(Date.now());
      setQuizState('active');
    } catch (err) {
      setError(String(err));
      // Fallback to demo mode if document '1' or offline
      if (selectedDoc === '1' || selectedDoc === '') {
        setQuizId('demo-1');
        setQuestions(demoQuiz.slice(0, questionCount));
        setCurrentQ(0);
        setAnswers({});
        setSelectedAnswer('');
        setShowExplanation(false);
        setScore(null);
        setCorrectCount(null);
        setStartTime(Date.now());
        setQuizState('active');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);
    setAnswers(prev => ({ ...prev, [questions[currentQ].id]: answer }));
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    setQuizState('results');
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          userId: user?.id || 'demo-user',
          timeTaken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit quiz');

      setScore(data.score !== undefined ? data.score : 0);
      setCorrectCount(data.correctCount !== undefined ? data.correctCount : 0);
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      // Local fallback calculation
      let correct = 0;
      questions.forEach(q => {
        if (answers[q.id] && answers[q.id].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          correct++;
        }
      });
      setCorrectCount(correct);
      setScore(questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0);
    } finally {
      setSubmitting(false);
    }
  };

  if (quizState === 'setup') {
    return (
      <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '700px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🎯 <span className="gradient-text">Quiz Generator</span></h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
          Generate personalized quizzes from your study materials using AI
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
            color: '#fca5a5', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between'
          }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="glass" style={{ padding: '32px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Document select */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '0.9rem' }}>
              Select Document
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
              {documents.map(doc => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc.id)}
                  style={{
                    textAlign: 'left', padding: '12px 16px', borderRadius: '12px',
                    border: `1px solid ${selectedDoc === doc.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: selectedDoc === doc.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    color: selectedDoc === doc.id ? '#a5b4fc' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', fontSize: '0.875rem',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                >
                  <span>{selectedDoc === doc.id ? '✓' : '○'}</span>
                  <span>{doc.name}</span>
                </button>
              ))}
              {documents.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '12px' }}>
                  No processed documents found. <a href="/dashboard/documents" style={{ color: '#818cf8', textDecoration: 'underline' }}>Upload one now</a>.
                </p>
              )}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '0.9rem' }}>
              Difficulty Level
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer',
                    border: `1px solid ${difficulty === d ? (d === 'easy' ? '#10b981' : d === 'medium' ? '#f59e0b' : '#ef4444') : 'rgba(255,255,255,0.08)'}`,
                    background: difficulty === d ? (d === 'easy' ? 'rgba(16,185,129,0.12)' : d === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)') : 'transparent',
                    color: difficulty === d ? (d === 'easy' ? '#6ee7b7' : d === 'medium' ? '#fcd34d' : '#fca5a5') : 'var(--text-muted)',
                    fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                >
                  {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Count */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '0.9rem' }}>
              Number of Questions
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[5, 8, 10].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer',
                    border: `1px solid ${questionCount === count ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: questionCount === count ? 'rgba(99,102,241,0.12)' : 'transparent',
                    color: questionCount === count ? '#a5b4fc' : 'var(--text-muted)',
                    fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Topic Focus */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>
              Focus Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Photosynthesis light reactions, WW2 Pacific front..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Quiz info */}
          <div style={{
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '14px', padding: '16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center'
          }}>
            {[
              { label: 'Questions', value: String(questionCount) },
              { label: 'Time Limit', value: 'Unlimited' },
              { label: 'Question Types', value: 'MCQ + T/F' }
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a5b4fc' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={generating}
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
          >
            {generating ? (
              <>
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center', marginRight: '6px' }}>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </span>
                Generating with AI...
              </>
            ) : '🤖 Generate AI Quiz'}
          </button>
        </div>
      </div>
    );
  }

  if (quizState === 'active' && questions.length > 0) {
    const q = questions[currentQ];
    const isCorrect = selectedAnswer === q.correctAnswer;
    const progress = (currentQ / questions.length) * 100;

    return (
      <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '700px' }}>
        {/* Progress */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Question {currentQ + 1} of {questions.length}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-brand">{q.type === 'mcq' ? 'Multiple Choice' : 'True / False'}</span>
              <span className="badge badge-success">🔥 {Math.round(progress)}%</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="glass" style={{ padding: '28px', borderRadius: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.6 }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {(q.options || ['True', 'False']).map(opt => {
            let bg = 'rgba(255,255,255,0.03)';
            let border = 'rgba(255,255,255,0.08)';
            let color = 'var(--text-primary)';

            if (showExplanation) {
              if (opt === q.correctAnswer) { bg = 'rgba(16,185,129,0.12)'; border = '#10b981'; color = '#6ee7b7'; }
              else if (opt === selectedAnswer) { bg = 'rgba(239,68,68,0.12)'; border = '#ef4444'; color = '#fca5a5'; }
            } else if (selectedAnswer === opt) {
              bg = 'rgba(99,102,241,0.15)'; border = '#6366f1'; color = '#a5b4fc';
            }

            const optIndex = (q.options || ['True', 'False']).indexOf(opt);
            const optLetter = ['A', 'B', 'C', 'D'][optIndex] || String(optIndex + 1);

            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                style={{
                  width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: '14px',
                  border: `1px solid ${border}`, background: bg, color,
                  cursor: showExplanation ? 'default' : 'pointer', fontFamily: 'inherit',
                  fontSize: '0.9rem', transition: 'all 0.2s', fontWeight: selectedAnswer === opt ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700
                }}>
                  {showExplanation && opt === q.correctAnswer ? '✓' : showExplanation && opt === selectedAnswer && !isCorrect ? '✗' : optLetter}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div style={{
            padding: '16px 20px', borderRadius: '14px', marginBottom: '20px',
            background: isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            <div style={{ fontWeight: 700, marginBottom: '6px', color: isCorrect ? '#6ee7b7' : '#fca5a5', fontSize: '0.9rem' }}>
              {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 <strong>Explanation:</strong> {q.explanation}
            </p>
          </div>
        )}

        {showExplanation && (
          <button onClick={handleNext} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {currentQ < questions.length - 1 ? 'Next Question →' : '🏁 See Results'}
          </button>
        )}
      </div>
    );
  }

  if (quizState === 'results') {
    if (submitting) {
      return (
        <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '700px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 2s ease-in-out infinite' }}>🎓</div>
            <h3 style={{ marginBottom: '8px', fontWeight: 700 }}>Submitting answers...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI is checking your answers and updating your progress stats...</p>
          </div>
        </div>
      );
    }

    const displayScore = score !== null ? score : 0;
    const displayCorrect = correctCount !== null ? correctCount : 0;
    const scoreColor = displayScore >= 80 ? '#10b981' : displayScore >= 60 ? '#f59e0b' : '#ef4444';
    const scoreLabel = displayScore >= 90 ? 'Excellent! 🏆' : displayScore >= 80 ? 'Great Work! 🌟' : displayScore >= 70 ? 'Good Job! 👍' : displayScore >= 60 ? 'Keep Practicing 📚' : 'Needs Review 🔄';

    return (
      <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '700px' }}>
        <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎓</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Quiz Complete!</h2>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: scoreColor, fontFamily: 'Plus Jakarta Sans', marginBottom: '4px' }}>
            {displayScore}%
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: scoreColor, marginBottom: '24px' }}>{scoreLabel}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
            {[
              { label: 'Correct', value: `${displayCorrect}/${questions.length}`, color: '#10b981' },
              { label: 'Score', value: `${displayScore}%`, color: scoreColor },
              { label: 'Grade', value: displayScore >= 90 ? 'A+' : displayScore >= 80 ? 'A' : displayScore >= 70 ? 'B' : displayScore >= 60 ? 'C' : 'F', color: scoreColor }
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'Plus Jakarta Sans' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => { setQuizState('setup'); setAnswers({}); setScore(null); setCorrectCount(null); }} className="btn-secondary">
              🔄 Try Again
            </button>
            <button onClick={() => router.push('/dashboard/chat')} className="btn-primary">
              💬 Review with AI
            </button>
          </div>
        </div>

        {/* Question review */}
        <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>📋 Question Review</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {questions.map((q, i) => {
              const correct = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} style={{
                  padding: '12px 16px', borderRadius: '12px',
                  background: correct ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                  display: 'flex', alignItems: 'flex-start', gap: '10px'
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>{correct ? '✅' : '❌'}</span>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>{i + 1}. {q.question}</p>
                    {!correct && (
                      <p style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>✓ Correct: {q.correctAnswer}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
