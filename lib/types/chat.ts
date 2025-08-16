export interface ChatMessage {
  id: string;
  teamId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  sources?: DocumentSource[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DocumentSource {
  documentId: string;
  documentName: string;
  snippet: string;
  relevanceScore: number;
}

export interface ChatSession {
  id: string;
  teamId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  teamId: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
  sources?: DocumentSource[];
}
