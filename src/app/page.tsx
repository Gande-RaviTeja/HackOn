'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${-x * 20}px, ${-y * 20}px)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div
        ref={orb1Ref}
        className="bg-orb"
        style={{ width: '600px', height: '600px', background: '#6366f1', top: '-200px', left: '-100px', transition: 'transform 0.3s ease' }}
      />
      <div
        ref={orb2Ref}
        className="bg-orb"
        style={{ width: '500px', height: '500px', background: '#a855f7', bottom: '-150px', right: '-100px', transition: 'transform 0.3s ease' }}
      />
      <div
        className="bg-orb"
        style={{ width: '400px', height: '400px', background: '#ec4899', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: '0.06' }}
      />

      {/* Grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(10,10,15,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
          }}></div> */}
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.2rem' }}>
            Learn<span className="gradient-text">Sphere AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/login" className="btn-ghost" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>
            Sign In
          </Link>
          <Link href="/register" className="btn-primary" style={{ textDecoration: 'none' }}>
            Get Started Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 40px 80px'
      }}>


        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', maxWidth: '900px' }}>
          Transform Your Study Materials Into{' '}
          <span className="gradient-text">AI-Powered</span> Knowledge
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.7 }}>
          Upload PDFs, ask questions, generate quizzes, get instant summaries, and receive personalized learning recommendations — all powered by advanced AI.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/register')}
            className="btn-primary"
            style={{ fontSize: '1rem', padding: '14px 32px', borderRadius: '12px' }}
          >
            Start Learning Free
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
            style={{ fontSize: '1rem', padding: '14px 32px', borderRadius: '12px' }}
          >
            Try Demo
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '48px', marginTop: '80px', flexWrap: 'wrap', justifyContent: 'center'
        }}>
          {[
            { value: '10K+', label: 'Students' },
            { value: '50K+', label: 'Documents Analyzed' },
            { value: '98%', label: 'Satisfaction Rate' },
            { value: '5x', label: 'Faster Learning' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }} className="gradient-text">
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '16px' }}>
            Everything You Need to <span className="gradient-text">Learn Faster</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
            A complete AI learning ecosystem designed for modern students.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {[
            { icon: '💬', title: 'AI Chat with Documents', desc: 'Ask questions about your study materials and get instant, accurate answers with source citations.', color: '#6366f1' },
            { icon: '📋', title: 'Smart Summarization', desc: 'Transform lengthy documents into concise, structured summaries with key points and definitions.', color: '#a855f7' },
            { icon: '🎯', title: 'Quiz Generator', desc: 'Automatically create MCQs, True/False, and short-answer questions from any study material.', color: '#ec4899' },
            { icon: '🧠', title: 'Personalized Learning', desc: 'AI adapts explanations and recommendations based on your learning patterns and performance.', color: '#06b6d4' },
            { icon: '🔍', title: 'Semantic Search', desc: 'Find relevant information across all your documents instantly with AI-powered search.', color: '#10b981' },
            { icon: '📊', title: 'Progress Dashboard', desc: 'Track study sessions, quiz scores, streaks, and get AI-powered study recommendations.', color: '#f59e0b' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass card-hover"
              style={{ padding: '28px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 100, height: 100, borderRadius: '50%',
                background: feature.color, opacity: 0.06, filter: 'blur(20px)'
              }} />
              <div style={{
                width: 48, height: 48, borderRadius: '12px',
                background: `${feature.color}20`, border: `1px solid ${feature.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', marginBottom: '16px'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        position: 'relative', zIndex: 10,
        padding: '80px 40px', textAlign: 'center'
      }}>
        <div className="glass gradient-border" style={{
          maxWidth: '800px', margin: '0 auto', padding: '60px 40px',
          borderRadius: '28px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
            borderRadius: 'inherit'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎓</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '16px' }}>
              Ready to Transform Your Learning?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.05rem' }}>
              Join thousands of students already learning smarter with LearnSphere AI.
            </p>
            <button
              onClick={() => router.push('/register')}
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '14px 36px', borderRadius: '12px' }}
            >
              Get Started — It's Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span></span>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>LearnSphere AI</span>
          <span>— Personalized AI Learning</span>
        </div>
        <div>© 2024 LearnSphere AI. Built with  for students worldwide.</div>
      </footer>
    </div>
  );
}
