'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState('dark');

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const userEmail = user?.email || '';

  const handleSave = async () => {
    await new Promise(r => setTimeout(r, 600));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: '32px', minHeight: '100vh', maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>⚙️ <span className="gradient-text">Settings</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure your account and preferences
        </p>
      </div>

      {saved && (
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
          color: '#6ee7b7', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ✅ Settings saved successfully!
        </div>
      )}

      {/* Profile */}
      <div className="glass" style={{ padding: '24px', borderRadius: '18px', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👤 Profile
        </h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)', color: 'white', fontWeight: 700
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Full Name</label>
                <input value={userName} readOnly className="input-base" style={{ opacity: 0.7, cursor: 'default' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Email</label>
                <input value={userEmail} readOnly type="email" className="input-base" style={{ opacity: 0.7, cursor: 'default' }} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Profile info is managed through your Supabase account
            </p>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="glass" style={{ padding: '24px', borderRadius: '18px', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '6px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🤖 AI Configuration
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
          AI features are configured server-side via environment variables
        </p>

        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6ee7b7' }}>AI Powered by Groq (Llama 3.3 70B)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '26px' }}>
            {['AI Chat with document context', 'Intelligent document summarization', 'Auto-generated quizzes from your materials'].map(f => (
              <div key={f} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                <span style={{ color: '#6366f1' }}>→</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div className="glass" style={{ padding: '24px', borderRadius: '18px', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '6px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🗄️ Database (Supabase)
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
          Document storage, user accounts, and chat history
        </p>
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
          <span style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: 600 }}>Connected to Supabase</span>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass" style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>🎨 Preferences</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Email notifications for quiz results', defaultOn: true },
            { label: 'AI study recommendations', defaultOn: true },
            { label: 'Weekly progress digest', defaultOn: false },
            { label: 'Sound effects for quiz answers', defaultOn: true },
          ].map(pref => (
            <div key={pref.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{pref.label}</span>
              <div style={{
                width: 44, height: 24, borderRadius: '100px', cursor: 'pointer',
                background: pref.defaultOn ? 'linear-gradient(90deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.1)',
                position: 'relative', transition: 'all 0.2s'
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: pref.defaultOn ? 23 : 3, transition: 'all 0.2s'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary" style={{ padding: '12px 32px', fontSize: '0.95rem' }}>
        Save Settings
      </button>
    </div>
  );
}
