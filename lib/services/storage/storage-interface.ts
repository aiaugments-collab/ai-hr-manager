/**
 * Storage abstraction interface - easily swap between different storage providers
 */

import { Document } from '@/lib/types/document';

export interface StorageProvider {
  /**
   * Upload a file and return the public URL
   */
  uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    teamId: string
  ): Promise<string>;

  /**
   * Delete a file by URL
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * Get a signed URL for temporary access (optional)
   */
  getSignedUrl?(fileUrl: string, expiresIn?: number): Promise<string>;
}

export interface DatabaseProvider {
  /**
   * Save document metadata to database
   */
  saveDocument(document: Omit<Document, 'id'>): Promise<string>;

  /**
   * Get documents for a team
   */
  getDocuments(teamId: string): Promise<Document[]>;

  /**
   * Delete document from database
   */
  deleteDocument(id: string): Promise<void>;

  /**
   * Search documents by text content
   */
  searchDocuments(teamId: string, query: string): Promise<Document[]>;

  /**
   * Get document by ID
   */
  getDocumentById(id: string): Promise<Document | null>;
}
