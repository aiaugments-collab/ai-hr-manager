export interface Document {
  id: string;
  teamId: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'txt';
  size: number;
  uploadedAt: Date | string; // Date object or string from API
  fileUrl: string;
  textContent: string; // extracted text for AI
  createdBy: string;
  createdAt: Date | string; // Date object or string from API
  updatedAt: Date | string; // Date object or string from API
}

export interface DocumentUploadResult {
  success: boolean;
  document?: Document;
  error?: string;
}

export interface DocumentSearchResult {
  document: Document;
  snippet: string;
  relevanceScore: number;
}
