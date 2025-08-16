import { StorageProvider } from './storage-interface';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/utils/logger';

export class CloudinaryStorageProvider implements StorageProvider {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dogcsr68o',
      api_key: process.env.CLOUDINARY_API_KEY || '578489783916298',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'umypIYIDQBc9NSY3gfGWVs9jyLY',
      secure: true
    });
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    teamId: string
  ): Promise<string> {
    try {
      logger.info('Uploading file to Cloudinary', { fileName, teamId, size: file.length }, 'CloudinaryStorage');
      
      // Determine resource type based on content type
      const resourceType = this.getResourceType(contentType);
      
      // Create upload options
      const uploadOptions = {
        resource_type: resourceType,
        public_id: `documents/${teamId}/${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}`,
        original_filename: fileName,
        folder: `aihr/documents/${teamId}`,
        use_filename: true,
        unique_filename: true,
        context: {
          teamId,
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          contentType
        },
        tags: ['document', `team-${teamId}`]
      };
      
      // Upload file to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(file);
      }) as any;
      
      logger.info('File uploaded successfully to Cloudinary', { 
        fileName, 
        publicId: result.public_id,
        secureUrl: result.secure_url 
      }, 'CloudinaryStorage');
      
      return result.secure_url;
      
    } catch (error) {
      logger.error('Failed to upload file to Cloudinary', error, 'CloudinaryStorage');
      throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      logger.info('Deleting file from Cloudinary', { fileUrl }, 'CloudinaryStorage');
      
      // Extract public ID from URL
      const publicId = this.extractPublicIdFromUrl(fileUrl);
      
      if (!publicId) {
        throw new Error('Could not extract public ID from URL');
      }
      
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary deletion failed: ${result.result}`);
      }
      
      logger.info('File deleted successfully from Cloudinary', { 
        fileUrl, 
        publicId, 
        result: result.result 
      }, 'CloudinaryStorage');
      
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary', error, 'CloudinaryStorage');
      throw new Error(`Cloudinary delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      logger.info('Generating signed URL for Cloudinary file', { fileUrl, expiresIn }, 'CloudinaryStorage');
      
      // Extract public ID from URL
      const publicId = this.extractPublicIdFromUrl(fileUrl);
      
      if (!publicId) {
        throw new Error('Could not extract public ID from URL');
      }
      
      // Generate signed URL with expiration using auth_token
      const timestamp = Math.round(Date.now() / 1000) + expiresIn;
      
      const signedUrl = cloudinary.utils.url(publicId, {
        sign_url: true,
        auth_token: {
          duration: expiresIn
        }
      });
      
      logger.info('Signed URL generated successfully', { publicId, expiresIn }, 'CloudinaryStorage');
      
      return signedUrl || fileUrl;
      
    } catch (error) {
      logger.error('Failed to generate signed URL', error, 'CloudinaryStorage');
      // Return original URL as fallback
      return fileUrl;
    }
  }

  /**
   * Determine Cloudinary resource type from content type
   */
  private getResourceType(contentType: string): 'image' | 'video' | 'raw' | 'auto' {
    if (contentType.startsWith('image/')) {
      return 'image';
    } else if (contentType.startsWith('video/')) {
      return 'video';
    } else {
      return 'raw'; // For PDFs, documents, etc.
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{format}
      const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      logger.error('Failed to extract public ID from URL', { url, error }, 'CloudinaryStorage');
      return null;
    }
  }

  /**
   * Get file info from Cloudinary
   */
  async getFileInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Failed to get file info from Cloudinary', error, 'CloudinaryStorage');
      throw error;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folderPath: string, maxResults: number = 100): Promise<any[]> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: maxResults
      });
      
      return result.resources;
    } catch (error) {
      logger.error('Failed to list files from Cloudinary', error, 'CloudinaryStorage');
      throw error;
    }
  }
}
