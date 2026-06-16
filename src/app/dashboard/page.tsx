'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface DashboardData {
  totalDocuments: number;
  totalChats: number;
  totalQuizzes: number;
  averageScore: number;
  studyStreak: number;
  totalStudyMinutes: number;
  recentActivity: { type: string; title: string; description: string; timestamp: string }[];
  studyMinutesByDay: { day: string; minutes: number }[];
  quizScores: { date: string; score: number }[];
  recommendations: { topic: string; reason: string; documentName: string; priority: string }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good morning');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17) setGreeting('Good evening');
  }, []);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { 'x-user-id': user?.id || '' },
        });
        const json = await res.json();
        setData(json);
      } catch {
        // Use empty defaults on error
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  const totalDocs = data?.totalDocuments || 0;
  const totalHours = Math.round((data?.totalStudyMinutes || 0) / 60);
  const totalQuizzes = data?.totalQuizzes || 0;
  const avgScore = data?.averageScore || 0;
  const streak = data?.studyStreak || 0;
  const studyData = data?.studyMinutesByDay?.length ? data.studyMinutesByDay : [];
  const quizScores = data?.quizScores?.length ? data.quizScores : [];
  const recentActivity = data?.recentActivity || [];
  const recommendations = data?.recommendations || [];

  const stats = [
    { label: 'Documents', value: `${totalDocs}`, icon: '📁', color: '#6366f1' },
    { label: 'Study Hours', value: `${totalHours}h`, icon: '⏱️', color: '#a855f7' },
    { label: 'Quizzes Taken', value: `${totalQuizzes}`, icon: '🎯', color: '#10b981' },
    { label: 'Avg. Score', value: `${avgScore}%`, icon: '⭐', color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: '32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {greeting}, {userName} 👋
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Learning <span className="gradient-text">Dashboard</span>
          </h1>
          {streak > 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.9rem' }}>
              You&apos;re on a <span style={{ color: '#f59e0b', fontWeight: 700 }}>🔥 {streak}-day</span> study streak! Keep it up!
            </p>
          ) : (
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.9rem' }}>
              Welcome! Upload a document to get started 🚀
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/documents" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
            📤 Upload Document
          </Link>
          <Link href="/dashboard/chat" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
            💬 Start Chat
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="glass card-hover" style={{ padding: '24px', borderRadius: '18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: -10, right: -10,
              width: 80, height: 80, borderRadius: '50%',
              background: stat.color, opacity: 0.08, filter: 'blur(15px)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '10px',
                background: `${stat.color}18`, border: `1px solid ${stat.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px', fontFamily: 'Plus Jakarta Sans' }}>
              {loading ? '—' : stat.value}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Study time chart */}
        <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Study Time</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Last 7 days</p>
            </div>
            <div className="badge badge-brand">This Week</div>
          </div>
          {studyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={studyData}>
                <defs>
                  <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }}
                  formatter={(value) => [`${value} min`, 'Study Time']}
                />
                <Area type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2.5} fill="url(#studyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              📊 No study data yet — start learning!
            </div>
          )}
        </div>

        {/* Quiz scores chart */}
        <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Quiz Scores</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Recent performance</p>
            </div>
            {avgScore > 0 && <div className="badge badge-success">Avg {avgScore}%</div>}
          </div>
          {quizScores.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={quizScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {quizScores.map((entry, index) => (
                    <Cell key={index} fill={entry.score >= 80 ? '#10b981' : entry.score >= 70 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              🎯 No quizzes taken yet — try one!
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* Recent Activity */}
        <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🕐 Recent Activity
          </h3>
          {recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                  }}>
                    {item.type === 'upload' ? '📤' : item.type === 'quiz' ? '🎯' : item.type === 'chat' ? '💬' : '📋'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
              No activity yet. Upload a document to get started!
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 AI Recommendations
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>Topics to review next</p>
          {recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec, i) => (
                <div key={i} className="card-hover" style={{
                  padding: '14px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer'
                }}
                  onClick={() => router.push('/dashboard/chat')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{rec.topic}</span>
                    <span className={`badge ${rec.priority === 'high' ? 'badge-danger' : rec.priority === 'medium' ? 'badge-warning' : 'badge-brand'}`}
                      style={{ fontSize: '0.65rem' }}>
                      {rec.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>📁 {rec.documentName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💡 {rec.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧠</div>
              Upload documents and take quizzes to get personalized recommendations!
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => router.push('/dashboard/documents')} className="btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '10px', fontSize: '0.85rem' }}>
              📤 Upload Your First Document
            </button>
            <button onClick={() => router.push('/dashboard/chat')} className="btn-secondary" style={{ justifyContent: 'center', width: '100%', padding: '10px', fontSize: '0.85rem' }}>
              💬 Start AI Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
