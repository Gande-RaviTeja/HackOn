'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error: authError } = await signUp(email, password, name);

    if (authError) {
      setError(authError);
      setLoading(false);
      return;
    }

    // Supabase may require email confirmation depending on project settings
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      <div className="bg-orb" style={{ width: '500px', height: '500px', background: '#a855f7', top: '-150px', right: '-100px' }} />
      <div className="bg-orb" style={{ width: '400px', height: '400px', background: '#6366f1', bottom: '-100px', left: '-100px' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
            }}>🎓</div>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
              Learn<span className="gradient-text">Sphere AI</span>
            </span>
          </Link>
        </div>

        <div className="glass" style={{
          borderRadius: '24px', padding: '40px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
            Join thousands of students learning smarter
          </p>

          {success ? (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '14px', padding: '24px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#6ee7b7' }}>
                Account Created!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Check your email to confirm your account, then sign in.
              </p>
              <Link href="/login" className="btn-primary" style={{
                display: 'inline-flex', justifyContent: 'center', padding: '12px 32px',
                textDecoration: 'none'
              }}>
                → Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                  color: '#fca5a5', fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create a strong password (min 6 chars)"
                    className="input-base"
                    required
                    minLength={6}
                  />
                </div>

                {/* Features checklist */}
                <div style={{
                  background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  {['AI Chat with your documents', 'Auto-generate quizzes & summaries', 'Personalized learning dashboard', 'Free forever — no credit card'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span> {f}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ justifyContent: 'center', padding: '12px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '⏳ Creating account...' : '🚀 Create Free Account'}
                </button>
              </form>
            </>
          )}

          {!success && (
            <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
