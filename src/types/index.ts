// Type definitions for LearnSphere AI

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  pageCount?: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  pageNumber?: number;
  chunkIndex: number;
  embedding?: number[];
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  documentId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: Date;
}

export interface Citation {
  pageNumber: number;
  excerpt: string;
  documentName: string;
}

export interface Quiz {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  topic?: string;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  orderIndex: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  completedAt: Date;
  timeTaken: number;
}

export interface LearningStats {
  id: string;
  userId: string;
  date: string;
  studyMinutes: number;
  quizzesTaken: number;
  documentsViewed: number;
  messagesCount: number;
}

export interface StudyRecommendation {
  topic: string;
  reason: string;
  documentName: string;
  documentId: string;
  priority: 'high' | 'medium' | 'low';
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  documentId: string;
  fileUrl: string;
  status: string;
}

export interface SummarizeResponse {
  summary: string;
  keyPoints: string[];
  definitions: Record<string, string>;
  pageCount: number;
}

export interface QuizGenerateResponse {
  quizId: string;
  questions: QuizQuestion[];
  title: string;
}

export interface DashboardStats {
  totalDocuments: number;
  totalChats: number;
  totalQuizzes: number;
  averageScore: number;
  studyStreak: number;
  totalStudyMinutes: number;
  recentActivity: ActivityItem[];
  quizScores: QuizScorePoint[];
  studyMinutesByDay: StudyDayPoint[];
  recommendations: StudyRecommendation[];
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'chat' | 'quiz' | 'summary';
  title: string;
  description: string;
  timestamp: Date;
}

export interface QuizScorePoint {
  date: string;
  score: number;
  quizTitle: string;
}

export interface StudyDayPoint {
  day: string;
  minutes: number;
}
