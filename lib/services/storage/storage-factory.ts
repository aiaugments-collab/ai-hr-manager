import { StorageProvider, DatabaseProvider } from './storage-interface';
import { FirebaseStorageProvider } from './firebase-storage';
import { FirebaseDatabaseProvider } from './firebase-database';
import { CloudinaryStorageProvider } from './cloudinary-storage';
import { logger } from '@/lib/utils/logger';

export type StorageProviderType = 'firebase' | 'cloudinary';
export type DatabaseProviderType = 'firebase';

export class StorageFactory {
  /**
   * Create storage provider based on type
   */
  static createStorageProvider(type: StorageProviderType): StorageProvider {
    logger.info('Creating storage provider', { type }, 'StorageFactory');
    
    switch (type) {
      case 'firebase':
        return new FirebaseStorageProvider();
      case 'cloudinary':
        return new CloudinaryStorageProvider();
      default:
        throw new Error(`Unsupported storage provider type: ${type}`);
    }
  }

  /**
   * Create database provider based on type
   */
  static createDatabaseProvider(type: DatabaseProviderType): DatabaseProvider {
    logger.info('Creating database provider', { type }, 'StorageFactory');
    
    switch (type) {
      case 'firebase':
        return new FirebaseDatabaseProvider();
      default:
        throw new Error(`Unsupported database provider type: ${type}`);
    }
  }

  /**
   * Get default storage provider from environment
   */
  static getDefaultStorageProvider(): StorageProvider {
    const defaultProvider = (process.env.DEFAULT_STORAGE_PROVIDER as StorageProviderType) || 'cloudinary';
    return this.createStorageProvider(defaultProvider);
  }

  /**
   * Get default database provider from environment
   */
  static getDefaultDatabaseProvider(): DatabaseProvider {
    const defaultProvider = (process.env.DEFAULT_DATABASE_PROVIDER as DatabaseProviderType) || 'firebase';
    return this.createDatabaseProvider(defaultProvider);
  }
}
