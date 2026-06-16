'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { formatFileSize } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

interface DocumentItem {
  id: string;
  name: string;
  file_size: number;
  file_type: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  page_count: number;
  created_at: string;
  summary?: string;
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents', {
        headers: { 'x-user-id': user?.id || '' },
      });
      const data = await res.json();
      if (data.data) setDocs(data.data);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Poll for processing docs
  useEffect(() => {
    const processingDocs = docs.filter(d => d.status === 'processing');
    if (processingDocs.length === 0) return;

    const interval = setInterval(fetchDocs, 3000);
    return () => clearInterval(interval);
  }, [docs, fetchDocs]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || '');

      // Optimistic UI
      const tempDoc: DocumentItem = {
        id: `temp-${Date.now()}`,
        name: file.name,
        file_size: file.size,
        file_type: file.type.includes('pdf') ? 'pdf' : 'docx',
        status: 'uploading',
        page_count: 0,
        created_at: new Date().toISOString(),
      };
      setDocs(prev => [tempDoc, ...prev]);

      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Upload failed');

        setDocs(prev => prev.map(d =>
          d.id === tempDoc.id ? { ...d, ...data.data, status: 'processing' } : d
        ));
      } catch (err) {
        setDocs(prev => prev.map(d =>
          d.id === tempDoc.id ? { ...d, status: 'error' } : d
        ));
        setError(`Failed to upload ${file.name}: ${String(err)}`);
      }
    }

    setUploading(false);
    setTimeout(fetchDocs, 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;

    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '32px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>📁 <span className="gradient-text">Documents</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            {docs.length} documents · {docs.filter(d => d.status === 'ready').length} ready for AI
          </p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="btn-primary" style={{ fontSize: '0.9rem' }}>
          Upload Document
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" multiple style={{ display: 'none' }}
          onChange={e => handleFileUpload(e.target.files)} />
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
          color: '#fca5a5', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFileUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: '20px', padding: '40px', textAlign: 'center',
          marginBottom: '24px', cursor: 'pointer', transition: 'all 0.3s ease',
          background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
          boxShadow: dragging ? '0 0 30px rgba(99,102,241,0.2)' : 'none',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{dragging ? '📂' : '📤'}</div>
        <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px' }}>
          {dragging ? 'Drop your files here!' : 'Drag & drop PDFs or click to browse'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Supports PDF and DOCX · Max 50MB per file</p>
        {uploading && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#a5b4fc' }}>
            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            <span style={{ fontSize: '0.875rem' }}>Uploading and processing with AI...</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
        <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
          className="input-base" style={{ paddingLeft: '42px' }} />
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass skeleton" style={{ height: '160px', borderRadius: '18px' }} />
          ))}
        </div>
      )}

      {/* Documents grid */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredDocs.map(doc => (
            <div key={doc.id} className="glass card-hover" style={{ borderRadius: '18px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: -15, right: -15, width: 80, height: 80, borderRadius: '50%',
                background: doc.status === 'error' ? '#ef4444' : doc.status === 'processing' ? '#f59e0b' : '#6366f1',
                opacity: 0.06, filter: 'blur(15px)'
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                  background: doc.file_type === 'pdf' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                  border: `1px solid ${doc.file_type === 'pdf' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
                }}>
                  {doc.file_type === 'pdf' ? '📄' : '📝'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {formatFileSize(doc.file_size)} · {formatTime(doc.created_at)}
                    {doc.page_count > 0 && ` · ${doc.page_count} pages`}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span className={`badge ${doc.status === 'ready' ? 'badge-success' : doc.status === 'error' ? 'badge-danger' : 'badge-warning'}`}
                    style={{ fontSize: '0.65rem' }}>
                    {doc.status === 'processing' ? '⏳ Processing' : doc.status === 'error' ? '✗ Error' : doc.status === 'uploading' ? '↑ Uploading' : '✓ Ready'}
                  </span>
                  {doc.status === 'ready' && (
                    <button onClick={() => handleDelete(doc.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '2px' }}
                      title="Delete document">🗑</button>
                  )}
                </div>
              </div>

              {(doc.status === 'processing' || doc.status === 'uploading') && (
                <div style={{ marginBottom: '12px' }}>
                  <div className="progress-bar">
                    <div className="progress-fill shimmer" style={{ width: doc.status === 'uploading' ? '30%' : '70%' }} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                    🤖 {doc.status === 'uploading' ? 'Uploading...' : 'AI is parsing and indexing your document...'}
                  </p>
                </div>
              )}

              {doc.summary && doc.status === 'ready' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {doc.summary}
                </p>
              )}

              {doc.status === 'ready' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={`/dashboard/chat?doc=${doc.id}`} className="btn-primary" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}>
                    💬 Chat
                  </a>
                  <a href={`/dashboard/quiz?doc=${doc.id}`} className="btn-secondary" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}>
                    🎯 Quiz
                  </a>
                  <a href={`/dashboard/summarize?doc=${doc.id}`} className="btn-ghost" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}>
                    📋 Summary
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredDocs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>{search ? 'No documents found' : 'No documents yet'}</p>
          <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
            {search ? 'Try a different search term' : 'Upload your first PDF or DOCX to get started!'}
          </p>
        </div>
      )}
    </div>
  );
}
