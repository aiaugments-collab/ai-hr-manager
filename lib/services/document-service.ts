import { Document, DocumentUploadResult, DocumentSearchResult } from '@/lib/types/document';
import { StorageProvider, DatabaseProvider } from './storage/storage-interface';
import { StorageFactory } from './storage/storage-factory';
import { TextExtractor } from './text-extractor';
import { logger } from '@/lib/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class DocumentService {
  // Easy to swap out storage providers - now defaults to Cloudinary!
  private static storageProvider: StorageProvider = StorageFactory.getDefaultStorageProvider();
  private static databaseProvider: DatabaseProvider = StorageFactory.getDefaultDatabaseProvider();

  /**
   * Set custom storage provider (for easy swapping)
   */
  static setStorageProvider(provider: StorageProvider): void {
    this.storageProvider = provider;
    logger.info('Storage provider updated', { provider: provider.constructor.name }, 'DocumentService');
  }

  /**
   * Set custom database provider (for easy swapping)
   */
  static setDatabaseProvider(provider: DatabaseProvider): void {
    this.databaseProvider = provider;
    logger.info('Database provider updated', { provider: provider.constructor.name }, 'DocumentService');
  }

  /**
   * Upload and process a document
   */
  static async uploadDocument(
    file: Buffer,
    fileName: string,
    fileType: string,
    teamId: string,
    createdBy: string
  ): Promise<DocumentUploadResult> {
    const timer = logger.time(`Document upload: ${fileName}`, 'DocumentService');
    
    try {
      logger.info('Starting document upload', { fileName, fileType, teamId, size: file.length }, 'DocumentService');
      
      // Validate file type
      if (!TextExtractor.isSupported(fileType)) {
        return {
          success: false,
          error: `Unsupported file type: ${fileType}. Supported types: PDF, DOC, DOCX, TXT`
        };
      }

      // Extract text content
      logger.info('Extracting text content', { fileName }, 'DocumentService');
      const textContent = await TextExtractor.extractText(file, fileName, fileType);
      
      if (!textContent.trim()) {
        logger.warn('No text content extracted', { fileName }, 'DocumentService');
      }

      // Upload file to storage
      logger.info('Uploading file to storage', { fileName }, 'DocumentService');
      const fileUrl = await this.storageProvider.uploadFile(file, fileName, fileType, teamId);

      // Prepare document data
      const documentData: Omit<Document, 'id'> = {
        teamId,
        name: fileName,
        type: this.getDocumentType(fileType),
        size: file.length,
        uploadedAt: new Date(),
        fileUrl,
        textContent,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      logger.info('Saving document metadata', { fileName }, 'DocumentService');
      const documentId = await this.databaseProvider.saveDocument(documentData);

      const document: Document = {
        id: documentId,
        ...documentData
      };

      logger.info('Document upload completed successfully', { 
        id: documentId, 
        fileName, 
        textLength: textContent.length 
      }, 'DocumentService');
      
      timer();
      return {
        success: true,
        document
      };

    } catch (error) {
      timer();
      logger.error('Document upload failed', error, 'DocumentService');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Get all documents for a team
   */
  static async getDocuments(teamId: string): Promise<Document[]> {
    try {
      logger.info('Fetching documents', { teamId }, 'DocumentService');
      
      const documents = await this.databaseProvider.getDocuments(teamId);
      
      logger.info('Documents fetched successfully', { teamId, count: documents.length }, 'DocumentService');
      return documents;
      
    } catch (error) {
      logger.error('Failed to fetch documents', error, 'DocumentService');
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(id: string): Promise<void> {
    try {
      logger.info('Deleting document', { id }, 'DocumentService');
      
      // Get document details first
      const document = await this.databaseProvider.getDocumentById(id);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from storage
      await this.storageProvider.deleteFile(document.fileUrl);
      
      // Delete from database
      await this.databaseProvider.deleteDocument(id);
      
      logger.info('Document deleted successfully', { id, name: document.name }, 'DocumentService');
      
    } catch (error) {
      logger.error('Failed to delete document', error, 'DocumentService');
      throw error;
    }
  }

  /**
   * Search documents by content
   */
  static async searchDocuments(teamId: string, query: string): Promise<DocumentSearchResult[]> {
    try {
      logger.info('Searching documents', { teamId, query }, 'DocumentService');
      
      const documents = await this.databaseProvider.searchDocuments(teamId, query);
      
      // Create search results with snippets
      const results: DocumentSearchResult[] = documents.map(doc => ({
        document: doc,
        snippet: this.createSnippet(doc.textContent, query),
        relevanceScore: this.calculateRelevanceScore(doc, query)
      }));

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      logger.info('Search completed', { teamId, query, results: results.length }, 'DocumentService');
      return results;
      
    } catch (error) {
      logger.error('Search failed', error, 'DocumentService');
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(id: string): Promise<Document | null> {
    try {
      return await this.databaseProvider.getDocumentById(id);
    } catch (error) {
      logger.error('Failed to get document by ID', error, 'DocumentService');
      throw error;
    }
  }

  /**
   * Convert file type to document type
   */
  private static getDocumentType(fileType: string): Document['type'] {
    switch (fileType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'application/msword':
        return 'doc';
      case 'text/plain':
        return 'txt';
      default:
        return 'pdf'; // fallback
    }
  }

  /**
   * Create a text snippet around the search query
   */
  private static createSnippet(text: string, query: string, maxLength: number = 200): string {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * Calculate relevance score for search results
   */
  private static calculateRelevanceScore(document: Document, query: string): number {
    const lowerText = document.textContent.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const lowerName = document.name.toLowerCase();
    
    let score = 0;
    
    // Title matches are more important
    if (lowerName.includes(lowerQuery)) {
      score += 50;
    }
    
    // Count occurrences in content
    const matches = (lowerText.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += matches * 10;
    
    // Boost score for exact matches
    if (lowerText.includes(lowerQuery)) {
      score += 20;
    }
    
    return Math.min(100, score);
  }
}
