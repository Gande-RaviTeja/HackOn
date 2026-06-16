'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  const handleDemo = () => {
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background */}
      <div className="bg-orb" style={{ width: '500px', height: '500px', background: '#6366f1', top: '-200px', left: '-150px' }} />
      <div className="bg-orb" style={{ width: '400px', height: '400px', background: '#a855f7', bottom: '-150px', right: '-100px' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
            Sign in to your learning journey
          </p>

          {/* Demo button */}
          <button
            onClick={handleDemo}
            className="btn-secondary"
            style={{ width: '100%', marginBottom: '24px', justifyContent: 'center', padding: '12px' }}
          >
            Try Demo — No Login Required
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
              color: '#fca5a5', fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                id="email"
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
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '12px', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : '→ Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
