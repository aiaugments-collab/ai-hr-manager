import { DatabaseProvider } from './storage-interface';
import { Document } from '@/lib/types/document';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

export class FirebaseDatabaseProvider implements DatabaseProvider {
  private readonly collectionName = 'documents';

  async saveDocument(document: Omit<Document, 'id'>): Promise<string> {
    try {
      logger.info('Saving document to Firestore', { name: document.name, teamId: document.teamId }, 'FirebaseDatabase');
      
      const docData = {
        ...document,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.collectionName), docData);
      
      logger.info('Document saved successfully', { id: docRef.id, name: document.name }, 'FirebaseDatabase');
      return docRef.id;
      
    } catch (error) {
      logger.error('Failed to save document to Firestore', error, 'FirebaseDatabase');
      throw new Error(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDocuments(teamId: string): Promise<Document[]> {
    try {
      logger.info('Fetching documents from Firestore', { teamId }, 'FirebaseDatabase');
      
      const q = query(
        collection(db, this.collectionName),
        where('teamId', '==', teamId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Document);
      });
      
      // Sort by uploadedAt descending (most recent first)
      // Helper to safely get time from Date or string
      const getTime = (date: Date | string): number => {
        return date instanceof Date ? date.getTime() : new Date(date).getTime();
      };
      
      documents.sort((a, b) => getTime(b.uploadedAt) - getTime(a.uploadedAt));
      
      logger.info('Documents fetched successfully', { teamId, count: documents.length }, 'FirebaseDatabase');
      return documents;
      
    } catch (error) {
      logger.error('Failed to fetch documents from Firestore', error, 'FirebaseDatabase');
      throw new Error(`Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      logger.info('Deleting document from Firestore', { id }, 'FirebaseDatabase');
      
      await deleteDoc(doc(db, this.collectionName, id));
      
      logger.info('Document deleted successfully', { id }, 'FirebaseDatabase');
      
    } catch (error) {
      logger.error('Failed to delete document from Firestore', error, 'FirebaseDatabase');
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchDocuments(teamId: string, query: string): Promise<Document[]> {
    try {
      logger.info('Searching documents in Firestore', { teamId, query }, 'FirebaseDatabase');
      
      // Simple text search - get all documents and filter client-side
      // For production, consider using Algolia or similar for better search
      const documents = await this.getDocuments(teamId);
      
      const searchResults = documents.filter(doc => 
        doc.textContent.toLowerCase().includes(query.toLowerCase()) ||
        doc.name.toLowerCase().includes(query.toLowerCase())
      );
      
      logger.info('Search completed', { teamId, query, results: searchResults.length }, 'FirebaseDatabase');
      return searchResults;
      
    } catch (error) {
      logger.error('Failed to search documents', error, 'FirebaseDatabase');
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDocumentById(id: string): Promise<Document | null> {
    try {
      logger.info('Fetching document by ID', { id }, 'FirebaseDatabase');
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        logger.warn('Document not found', { id }, 'FirebaseDatabase');
        return null;
      }
      
      const data = docSnap.data();
      const document: Document = {
        id: docSnap.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Document;
      
      logger.info('Document fetched successfully', { id, name: document.name }, 'FirebaseDatabase');
      return document;
      
    } catch (error) {
      logger.error('Failed to fetch document by ID', error, 'FirebaseDatabase');
      throw new Error(`Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
