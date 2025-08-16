import { StorageProvider } from './storage-interface';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { logger } from '@/lib/utils/logger';

export class FirebaseStorageProvider implements StorageProvider {
  private readonly basePath = 'documents';

  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    teamId: string
  ): Promise<string> {
    try {
      logger.info('Uploading file to Firebase Storage', { fileName, teamId, size: file.length }, 'FirebaseStorage');
      
      const filePath = `${this.basePath}/${teamId}/${Date.now()}-${fileName}`;
      const storageRef = ref(storage, filePath);
      
      const uploadResult = await uploadBytes(storageRef, file, {
        contentType,
        customMetadata: {
          teamId,
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      });
      
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      logger.info('File uploaded successfully', { fileName, downloadURL }, 'FirebaseStorage');
      return downloadURL;
      
    } catch (error) {
      logger.error('Failed to upload file to Firebase Storage', error, 'FirebaseStorage');
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      logger.info('Deleting file from Firebase Storage', { fileUrl }, 'FirebaseStorage');
      
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
      
      logger.info('File deleted successfully', { fileUrl }, 'FirebaseStorage');
      
    } catch (error) {
      logger.error('Failed to delete file from Firebase Storage', error, 'FirebaseStorage');
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
