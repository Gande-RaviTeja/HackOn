-- ============================================================
-- LearnSphere AI — Supabase Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  page_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','processing','ready','error')),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT CHUNKS TABLE (for RAG vector search)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER DEFAULT 1,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding vector(768),  -- Gemini text-embedding-004 dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS document_chunks_doc_id_idx
  ON document_chunks(document_id);

-- ============================================================
-- CHAT SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUIZZES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  topic TEXT,
  total_questions INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUIZ QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mcq','true_false','short_answer')),
  question TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- QUIZ ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '{}',
  time_taken INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEARNING STATS TABLE (daily tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  study_minutes INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  documents_viewed INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- ============================================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(768),
  match_document_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  page_number INTEGER,
  chunk_index INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.page_number,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.document_id = match_document_id
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Uncomment for production
-- ============================================================
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE learning_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STORAGE BUCKET (run in Supabase dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
