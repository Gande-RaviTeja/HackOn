'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { pageNumber: number; excerpt: string; similarity?: number }[];
  timestamp: Date;
  isTyping?: boolean;
  isDemo?: boolean;
}

const suggestedQuestions = [
  'Explain photosynthesis step by step',
  "What are Newton's three laws of motion?",
  'Summarize the key points of this document',
  'Create a quiz on this topic',
  'What are the most important formulas here?',
  'Explain the causes of World War II',
];

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('doc');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hello! I'm your **LearnSphere AI** assistant.\n\nI can help you:\n- 📖 **Explain concepts** from your uploaded documents\n- 📋 **Summarize chapters** and extract key points\n- 🎯 **Generate quiz questions** for practice\n- 🔍 **Find specific information** across your notes\n\nWhat would you like to learn today?",
      citations: [],
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id || 'demo-user', documentId }),
        });
        const data = await res.json();
        if (data.data?.id) setSessionId(data.data.id);
      } catch {
        setSessionId(`local-${Date.now()}`);
      }
    };
    createSession();
  }, [documentId]);

  const sendMessage = async (content?: string) => {
    const text = content || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const newHistory = [...conversationHistory, { role: 'user', content: text }];
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Typing indicator
    setMessages(prev => [...prev, {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          documentId,
          sessionId,
          userId: user?.id || 'demo-user',
          history: conversationHistory.slice(-6),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Chat failed');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        timestamp: new Date(),
        isDemo: data.demo,
      };

      setMessages(prev => prev.filter(m => m.id !== 'typing').concat(aiMsg));
      setConversationHistory([...newHistory, { role: 'assistant', content: data.answer }]);

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'typing').concat({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error: ${String(err)}. Please check your API configuration in Settings.`,
        timestamp: new Date(),
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} style={{ fontWeight: 700, color: '#a5b4fc', margin: '8px 0 4px' }}>{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <p key={i} style={{ paddingLeft: '16px', marginBottom: '4px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, color: '#6366f1' }}>•</span>
          {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
        </p>;
      }
      if (/^\d+\./.test(line)) {
        return <p key={i} style={{ paddingLeft: '20px', marginBottom: '4px' }}>{line}</p>;
      }
      if (line === '') return <div key={i} style={{ height: '8px' }} />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={i} style={{ marginBottom: '2px' }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#e2e8f0' }}>{p}</strong> : p)}
      </p>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '20px 32px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'var(--bg-surface)'
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
        }}>🤖</div>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 700 }}>LearnSphere AI Chat</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {loading ? 'Thinking...' : 'Ready · AI-Powered'}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {documentId && <span className="badge badge-brand">📎 Document linked</span>}
          <span className="badge badge-success">RAG Enabled</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: '12px', alignItems: 'flex-start',
            maxWidth: '85%',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #1a1a2e, #2d2d50)',
              border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
            }}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>

            <div>
              {msg.isTyping ? (
                <div className="chat-message-ai" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>AI is thinking...</span>
                  </div>
                </div>
              ) : (
                <div className={msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {renderContent(msg.content)}
                  </div>

                  {msg.isDemo && (
                    <div style={{
                      marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                      fontSize: '0.75rem', color: '#fcd34d'
                    }}>
                      ⚡ Demo mode · <a href="/dashboard/settings" style={{ color: '#fcd34d', textDecoration: 'underline' }}>Configure AI</a> for real AI responses
                    </div>
                  )}

                  {msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                        📚 Source citations from your document:
                      </div>
                      {msg.citations.map((cite, i) => (
                        <div key={i} style={{
                          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                          borderRadius: '8px', padding: '8px 10px', marginBottom: '4px'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Page {cite.pageNumber}</span>
                            {cite.similarity && <span>{cite.similarity}% match</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            &ldquo;{cite.excerpt}&rdquo;
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }} suppressHydrationWarning>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 32px 16px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>💡 Try asking:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestedQuestions.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '100px', padding: '6px 14px', fontSize: '0.8rem',
                  color: '#a5b4fc', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                onMouseOut={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your study materials... (Enter to send)"
            rows={1}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px', padding: '12px 16px', color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', outline: 'none',
              lineHeight: 1.5, maxHeight: '200px', overflowY: 'auto', transition: 'border-color 0.2s'
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary"
            style={{ padding: '12px 20px', borderRadius: '14px', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.5 : 1 }}
          >
            {loading ? '⏳' : '➤ Send'}
          </button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
          🔒 AI responses are grounded in your uploaded documents via RAG · Powered by Groq AI
        </p>
      </div>
    </div>
  );
}
