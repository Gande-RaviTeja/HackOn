'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface SummaryData {
  title: string;
  pageCount: number;
  readingTime: string;
  overview: string;
  keyPoints: string[];
  sections: { title: string; pages: string; summary: string }[];
  definitions: { term: string; definition: string }[];
  demo?: boolean;
  message?: string;
}

export default function SummarizePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedDoc = searchParams.get('doc');

  const [selectedDoc, setSelectedDoc] = useState(preselectedDoc || '');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'definitions'>('overview');
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/documents', { headers: { 'x-user-id': user?.id || '' } })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          const readyDocs = data.data.filter((d: { status: string }) => d.status === 'ready');
          setDocuments(readyDocs);
          if (!preselectedDoc && readyDocs.length > 0) setSelectedDoc(readyDocs[0].id);
        }
      })
      .catch(() => {
        setDocuments([
          { id: '1', name: 'Biology Chapter 5 - Photosynthesis.pdf' },
          { id: '2', name: 'Physics Formulas and Laws.pdf' },
          { id: '3', name: 'History Notes - World War II.pdf' },
        ]);
        if (!selectedDoc) setSelectedDoc('1');
      });
  }, [preselectedDoc]);

  const handleSummarize = async () => {
    if (!selectedDoc) { setError('Please select a document first'); return; }
    setLoading(true);
    setSummary(null);
    setError('');

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selectedDoc, userId: user?.id || '' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Summarization failed');

      setSummary(data);
      setActiveTab('overview');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>📋 <span className="gradient-text">AI Summarization</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Generate intelligent summaries powered by AI
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#fca5a5', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="glass" style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
            Select Document
          </label>
          <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)} className="input-base" style={{ cursor: 'pointer' }}>
            {documents.map(d => <option key={d.id} value={d.id} style={{ background: '#1a1a2e' }}>{d.name}</option>)}
          </select>
        </div>
        <button onClick={handleSummarize} disabled={loading || !selectedDoc} className="btn-primary" style={{ padding: '12px 24px', alignSelf: 'flex-end', opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', gap: '3px' }}><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>
              Generating...
            </span>
          ) : '🤖 Generate Summary'}
        </button>
      </div>

      {loading && (
        <div className="glass" style={{ padding: '40px', borderRadius: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 2s ease-in-out infinite' }}>📄</div>
          <h3 style={{ marginBottom: '8px', fontWeight: 700 }}>AI is analyzing your document...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>Extracting key concepts, summarizing sections, and building definitions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px', margin: '0 auto' }}>
            {['Reading document content...', 'Identifying key topics...', 'Building structured summary...'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: `typing-dot 1.2s ${i * 0.3}s infinite` }} />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {summary && !loading && (
        <div>
          <div className="glass" style={{ padding: '24px', borderRadius: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>{summary.title}</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="badge badge-brand">📄 {summary.pageCount} pages</span>
                  <span className="badge badge-success">⏱️ {summary.readingTime}</span>
                  {summary.demo ? <span className="badge badge-warning">⚡ Demo</span> : <span className="badge badge-success">🤖 AI Generated</span>}
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{summary.overview}</p>
            {summary.demo && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem', color: '#fcd34d' }}>
                ⚡ Demo mode · <a href="/dashboard/settings" style={{ color: '#fcd34d', textDecoration: 'underline' }}>Configure AI</a> to generate real summaries from your documents
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
            {(['overview', 'sections', 'definitions'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600,
                background: activeTab === tab ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', textTransform: 'capitalize'
              }}>
                {tab === 'overview' ? '📋 Key Points' : tab === 'sections' ? '📑 Sections' : '📖 Definitions'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>✨ Key Points</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {summary.keyPoints.map((point, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)'
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800, color: '#a5b4fc', flexShrink: 0
                    }}>{i + 1}</span>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {summary.sections.map((section, i) => (
                <div key={i} className="glass card-hover" style={{ padding: '20px', borderRadius: '16px', display: 'flex', gap: '16px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '10px', background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 800, color: '#a5b4fc', fontSize: '0.9rem', flexShrink: 0
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{section.title}</h4>
                      <span className="badge badge-brand" style={{ fontSize: '0.65rem' }}>pp. {section.pages}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{section.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'definitions' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {summary.definitions.map((def, i) => (
                <div key={i} className="glass card-hover" style={{ padding: '18px', borderRadius: '16px' }}>
                  <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px' }}>
                    {def.term}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{def.definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!summary && !loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>No summary generated yet</p>
          <p style={{ fontSize: '0.875rem' }}>Select a document and click &ldquo;Generate Summary&rdquo; to get started</p>
        </div>
      )}
    </div>
  );
}
