export type ContentType = 'audio' | 'video' | 'text' | 'image';

export interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  type: ContentType;
  mimeType?: string;
  fileUrl?: string;
  previewUrl?: string;
  base64?: string;
  text?: string;
  extractedText?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  sourceName: string;
  rawContent?: string;
  fileUrl?: string;
  attachments?: AttachmentFile[];
  durationOrSize?: string;
  extractedText: string;
  summary: string;
  keyTakeaways: string[];
  topic: string;
  chapter?: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface SummarySection {
  heading: string;
  content: string;
}

export interface SummaryItem {
  id: string;
  title: string;
  contentId?: string;
  subject: string;
  chapter?: string;
  summaryText: string;
  keyPoints: string[];
  sections?: SummarySection[];
  flashcards: Flashcard[];
  cheatSheet: string[];
  attachments?: AttachmentFile[];
  hasImageAnalysis?: boolean;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  percentage: number;
}

export interface QuizItem {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  contentId?: string;
  timeLimitMinutes?: number;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  createdAt: string;
}

export interface ExamReminder {
  id: string;
  title: string;
  subject: string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // e.g. "09:00 ص"
  location?: string; // e.g. "قاعة 101 - مبنى العلوم"
  targetScore: number; // e.g. 95%
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  topics?: string[];
  isPrepared: boolean;
  createdAt: string;
}

export type CustomTest = ExamReminder;

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  completedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isLoggedIn: boolean;
  provider: 'google' | 'guest' | 'email';
  gradeLevel?: string;
  targetExam?: string;
  streakDays: number;
  points: number;
  level: string;
  joinedDate: string;
}

export interface ChatAttachment {
  type: 'image' | 'audio' | 'file';
  url: string;
  name?: string;
  mimeType?: string;
  base64?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  topic?: string;
  suggestedQuestions?: string[];
  attachment?: ChatAttachment;
}
