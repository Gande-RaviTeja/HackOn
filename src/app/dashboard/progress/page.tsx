'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';

interface ProgressData {
  studyStreak: number;
  totalStudyMinutes: number;
  totalQuizzes: number;
  totalDocuments: number;
  totalChats: number;
  averageScore: number;
  studyMinutesByDay: { day: string; minutes: number }[];
  quizScores: { date: string; score: number }[];
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { 'x-user-id': user?.id || '' },
        });
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchData();
    else setLoading(false);
  }, [user]);

  const streak = data?.studyStreak || 0;
  const totalHours = ((data?.totalStudyMinutes || 0) / 60).toFixed(1);
  const totalQuizzes = data?.totalQuizzes || 0;
  const totalDocs = data?.totalDocuments || 0;
  const totalChats = data?.totalChats || 0;
  const avgScore = data?.averageScore || 0;

  const hasData = totalDocs > 0 || totalQuizzes > 0 || totalChats > 0;

  return (
    <div style={{ padding: '32px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>📊 <span className="gradient-text">Learning Progress</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Track your growth, study patterns, and academic performance over time
        </p>
      </div>

      {/* Streak & Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: '🔥', label: 'Study Streak', value: `${streak} days`, color: '#ef4444', sub: streak > 0 ? 'Keep it going!' : 'Start studying today!' },
          { icon: '⏱️', label: 'Total Study Time', value: `${totalHours}h`, color: '#6366f1', sub: 'Lifetime total' },
          { icon: '🎯', label: 'Quizzes Taken', value: `${totalQuizzes}`, color: '#a855f7', sub: avgScore > 0 ? `Avg score: ${avgScore}%` : 'Take your first quiz!' },
          { icon: '📁', label: 'Docs Processed', value: `${totalDocs}`, color: '#10b981', sub: totalDocs > 0 ? 'Ready for AI chat' : 'Upload your first doc' },
          { icon: '💬', label: 'AI Interactions', value: `${totalChats}`, color: '#f59e0b', sub: totalChats > 0 ? 'Chat sessions' : 'Start chatting!' },
        ].map(stat => (
          <div key={stat.label} className="glass card-hover" style={{ padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color, fontFamily: 'Plus Jakarta Sans' }}>
              {loading ? '—' : stat.value}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '4px 0 2px' }}>{stat.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts or empty state */}
      {hasData ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '6px' }}>Weekly Progress Trend</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>Study hours and quiz scores over time</p>
              {(data?.studyMinutesByDay?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data!.studyMinutesByDay}>
                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                    <Area type="monotone" dataKey="minutes" name="Study Minutes" stroke="#6366f1" strokeWidth={2.5} fill="url(#hoursGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  📈 Study data will appear as you learn
                </div>
              )}
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '6px' }}>Quiz Performance</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>Recent scores</p>
              {(data?.quizScores?.length || 0) > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data!.quizScores.map((q, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{q.date}</span>
                      <span style={{
                        fontWeight: 700, fontSize: '0.9rem',
                        color: q.score >= 80 ? '#10b981' : q.score >= 60 ? '#f59e0b' : '#ef4444'
                      }}>
                        {q.score}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  🎯 Take a quiz to see scores
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Empty state for new users */
        <div className="glass" style={{ padding: '48px', borderRadius: '18px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Start Your Learning Journey</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 24px' }}>
            Upload documents, chat with AI, and take quizzes to track your progress here.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/dashboard/documents" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 24px', fontSize: '0.9rem' }}>
              📤 Upload Document
            </a>
            <a href="/dashboard/chat" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 24px', fontSize: '0.9rem' }}>
              💬 Start AI Chat
            </a>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>🏅 Achievements & Milestones</h3>
        {hasData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {totalDocs > 0 && (
              <AchievementCard icon="📚" title="Document Explorer" desc={`Uploaded ${totalDocs} document${totalDocs > 1 ? 's' : ''}`} color="#6366f1" />
            )}
            {totalQuizzes > 0 && (
              <AchievementCard icon="🎯" title="Quiz Taker" desc={`Completed ${totalQuizzes} quiz${totalQuizzes > 1 ? 'zes' : ''}`} color="#a855f7" />
            )}
            {streak >= 3 && (
              <AchievementCard icon="🔥" title={`${streak}-Day Streak`} desc="Consistent study habits!" color="#ef4444" />
            )}
            {avgScore >= 80 && (
              <AchievementCard icon="⭐" title="High Achiever" desc={`Average score of ${avgScore}%`} color="#10b981" />
            )}
            {totalChats >= 5 && (
              <AchievementCard icon="💬" title="Curious Learner" desc={`${totalChats} AI chat sessions`} color="#f59e0b" />
            )}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
            Start learning to unlock achievements!
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <div className="card-hover" style={{
      padding: '16px', borderRadius: '14px',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: '14px'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '2px' }}>{title}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{desc}</div>
      </div>
    </div>
  );
}
