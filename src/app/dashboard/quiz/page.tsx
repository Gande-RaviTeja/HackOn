'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type QuestionType = 'mcq' | 'true_false';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct: string;
  explanation: string;
}

const generatedQuiz: Question[] = [
  {
    id: '1', type: 'mcq',
    question: 'What is the primary pigment used in photosynthesis?',
    options: ['Carotenoid', 'Chlorophyll', 'Anthocyanin', 'Phycoerythrin'],
    correct: 'Chlorophyll',
    explanation: 'Chlorophyll is the primary photosynthetic pigment found in plants. It absorbs light mainly in the red and blue-violet wavelengths.'
  },
  {
    id: '2', type: 'mcq',
    question: 'In which part of the chloroplast do the light-dependent reactions occur?',
    options: ['Stroma', 'Thylakoid membrane', 'Outer membrane', 'Matrix'],
    correct: 'Thylakoid membrane',
    explanation: 'The light-dependent reactions (light reactions) occur in the thylakoid membranes, where chlorophyll captures light energy.'
  },
  {
    id: '3', type: 'true_false',
    question: 'Oxygen is a byproduct of the light-dependent reactions of photosynthesis.',
    options: ['True', 'False'],
    correct: 'True',
    explanation: 'Correct! Oxygen is released when water molecules are split (photolysis) during the light-dependent reactions.'
  },
  {
    id: '4', type: 'mcq',
    question: 'What molecule is used to fix CO₂ in the Calvin cycle?',
    options: ['ATP', 'NADPH', 'RuBisCO', 'Glucose'],
    correct: 'RuBisCO',
    explanation: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase/oxygenase) is the enzyme responsible for carbon fixation in the Calvin cycle.'
  },
  {
    id: '5', type: 'true_false',
    question: 'The Calvin cycle requires direct sunlight to function.',
    options: ['True', 'False'],
    correct: 'False',
    explanation: 'The Calvin cycle (light-independent reactions) does not directly require light. It uses ATP and NADPH produced by the light reactions.'
  },
  {
    id: '6', type: 'mcq',
    question: 'What is the overall chemical equation for photosynthesis?',
    options: [
      'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O',
      '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
      '6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂',
      'C₆H₁₂O₆ + O₂ → CO₂ + H₂O + energy'
    ],
    correct: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    explanation: 'Photosynthesis converts carbon dioxide and water into glucose and oxygen using light energy.'
  },
  {
    id: '7', type: 'mcq',
    question: 'Which wavelengths of light are most effectively absorbed by chlorophyll?',
    options: ['Green and yellow', 'Red and blue-violet', 'Orange and ultraviolet', 'Infrared and white'],
    correct: 'Red and blue-violet',
    explanation: 'Chlorophyll a and b absorb light most effectively in the red (~680nm) and blue-violet (~430nm) wavelengths.'
  },
  {
    id: '8', type: 'true_false',
    question: 'The stroma is the aqueous fluid surrounding the thylakoids inside the chloroplast.',
    options: ['True', 'False'],
    correct: 'True',
    explanation: 'Correct! The stroma is the fluid-filled space of the chloroplast, where the Calvin cycle takes place.'
  },
];

type QuizState = 'setup' | 'active' | 'results';

export default function QuizPage() {
  const router = useRouter();
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [selectedDoc, setSelectedDoc] = useState('1');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generating, setGenerating] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const docs = [
    { id: '1', name: 'Biology Chapter 5 - Photosynthesis' },
    { id: '2', name: 'Physics Formulas and Laws' },
    { id: '3', name: 'History Notes - World War II' },
    { id: '4', name: 'Mathematics - Calculus' },
  ];

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    setCurrentQ(0);
    setAnswers({});
    setSelectedAnswer('');
    setShowExplanation(false);
    setQuizState('active');
  };

  const handleAnswer = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);
    setAnswers(prev => ({ ...prev, [generatedQuiz[currentQ].id]: answer }));
  };

  const handleNext = () => {
    if (currentQ < generatedQuiz.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
    } else {
      setQuizState('results');
    }
  };

  const calculateScore = () => {
    let correct = 0;
    generatedQuiz.forEach(q => {
      if (answers[q.id] === q.correct) correct++;
    });
    return Math.round((correct / generatedQuiz.length) * 100);
  };

  const score = quizState === 'results' ? calculateScore() : 0;

  if (quizState === 'setup') {
    return (
      <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '700px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🎯 <span className="gradient-text">Quiz Generator</span></h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
          Generate personalized quizzes from your study materials using AI
        </p>

        <div className="glass" style={{ padding: '32px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Document select */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '0.9rem' }}>
              Select Document
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {docs.map(doc => (
                <button
                  key={doc.id}
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
                  <span> {doc.name}</span>
                </button>
              ))}
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

          {/* Quiz info */}
          <div style={{
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '14px', padding: '16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center'
          }}>
            {[{ label: 'Questions', value: '8' }, { label: 'Time Limit', value: 'Unlimited' }, { label: 'Question Types', value: 'MCQ + T/F' }].map(stat => (
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
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
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

  if (quizState === 'active') {
    const q = generatedQuiz[currentQ];
    const isCorrect = selectedAnswer === q.correct;
    const progress = ((currentQ) / generatedQuiz.length) * 100;

    return (
      <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '700px' }}>
        {/* Progress */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Question {currentQ + 1} of {generatedQuiz.length}
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
          {q.options?.map(opt => {
            let bg = 'rgba(255,255,255,0.03)';
            let border = 'rgba(255,255,255,0.08)';
            let color = 'var(--text-primary)';

            if (showExplanation) {
              if (opt === q.correct) { bg = 'rgba(16,185,129,0.12)'; border = '#10b981'; color = '#6ee7b7'; }
              else if (opt === selectedAnswer) { bg = 'rgba(239,68,68,0.12)'; border = '#ef4444'; color = '#fca5a5'; }
            } else if (selectedAnswer === opt) {
              bg = 'rgba(99,102,241,0.15)'; border = '#6366f1'; color = '#a5b4fc';
            }

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
                  {showExplanation && opt === q.correct ? '✓' : showExplanation && opt === selectedAnswer && !isCorrect ? '✗' : ['A', 'B', 'C', 'D'][q.options!.indexOf(opt)]}
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
            {currentQ < generatedQuiz.length - 1 ? 'Next Question →' : '🏁 See Results'}
          </button>
        )}
      </div>
    );
  }

  // Results
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 90 ? 'Excellent! 🏆' : score >= 80 ? 'Great Work! 🌟' : score >= 70 ? 'Good Job! 👍' : score >= 60 ? 'Keep Practicing 📚' : 'Needs Review 🔄';

  return (
    <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '700px' }}>
      <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎓</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Quiz Complete!</h2>
        <div style={{ fontSize: '4rem', fontWeight: 900, color: scoreColor, fontFamily: 'Plus Jakarta Sans', marginBottom: '4px' }}>
          {score}%
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: scoreColor, marginBottom: '24px' }}>{scoreLabel}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Correct', value: `${generatedQuiz.filter(q => answers[q.id] === q.correct).length}/${generatedQuiz.length}`, color: '#10b981' },
            { label: 'Score', value: `${score}%`, color: scoreColor },
            { label: 'Grade', value: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F', color: scoreColor }
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'Plus Jakarta Sans' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => { setQuizState('setup'); setAnswers({}); }} className="btn-secondary">
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
          {generatedQuiz.map((q, i) => {
            const correct = answers[q.id] === q.correct;
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
                    <p style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>✓ Correct: {q.correct}</p>
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
