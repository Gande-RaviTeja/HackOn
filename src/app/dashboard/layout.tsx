'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/dashboard/documents', icon: '📁', label: 'Documents' },
  { href: '/dashboard/chat', icon: '💬', label: 'AI Chat' },
  { href: '/dashboard/summarize', icon: '📋', label: 'Summarize' },
  { href: '/dashboard/quiz', icon: '🎯', label: 'Quizzes' },
  { href: '/dashboard/progress', icon: '📊', label: 'Progress' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>🎓</div>
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const userEmail = user?.email || 'guest@learnsphere.ai';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 50,
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', boxShadow: '0 4px 12px rgba(99,102,241,0.35)', flexShrink: 0
            }}>🎓</div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>
                Learn<span className="gradient-text">Sphere</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>AI LEARNING PLATFORM</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 8px 8px' }}>
            MAIN MENU
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                  background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                  color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span style={{ fontSize: '18px', width: 24, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                    background: '#6366f1', boxShadow: '0 0 8px rgba(99,102,241,0.8)'
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div className="glass" style={{
            padding: '12px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', flexShrink: 0
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
            </div>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }}
              title="Sign out"
            >
              ↗
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '260px', flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
