import { logger } from '@/lib/utils/logger';

export class TextExtractor {
  /**
   * Extract text from various file types
   */
  static async extractText(buffer: Buffer, fileName: string, fileType: string): Promise<string> {
    const timer = logger.time(`Text extraction: ${fileName}`, 'TextExtractor');
    
    try {
      logger.info('Starting text extraction', { fileName, fileType, size: buffer.length }, 'TextExtractor');
      
      let extractedText = '';
      
      switch (fileType) {
        case 'application/pdf':
          extractedText = await this.extractFromPDF(buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          extractedText = await this.extractFromWord(buffer);
          break;
        case 'text/plain':
          extractedText = buffer.toString('utf-8');
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      // Clean up the text
      const cleanText = this.cleanExtractedText(extractedText);
      
      logger.info('Text extraction completed', { 
        fileName, 
        originalLength: extractedText.length,
        cleanedLength: cleanText.length 
      }, 'TextExtractor');
      
      timer();
      return cleanText;
      
    } catch (error) {
      timer();
      logger.error('Text extraction failed, returning placeholder', error, 'TextExtractor');
      
      // Instead of throwing, return a placeholder that indicates extraction failed
      // This allows the document upload to continue
      const placeholder = `[Document uploaded - text extraction failed for ${fileName}]`;
      
      logger.info('Returning placeholder text for failed extraction', { 
        fileName, 
        placeholder 
      }, 'TextExtractor');
      
      return placeholder;
    }
  }

  /**
   * Extract text from PDF using pdf-parse with better error handling
   */
  private static async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      logger.debug('Attempting PDF extraction', { bufferLength: buffer.length }, 'TextExtractor');
      
      // Try pdf-parse first
      try {
        const pdfParse = require('pdf-parse');
        
        // Ensure we have a valid buffer
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
          throw new Error('Invalid buffer provided');
        }
        
        logger.debug('Calling pdf-parse with buffer', { bufferLength: buffer.length }, 'TextExtractor');
        
        // Call pdf-parse with the buffer directly
        const data = await pdfParse(buffer, {
          // Disable external dependencies that might cause issues
          max: 0, // Parse all pages
          version: 'v1.10.100' // Use specific version
        });
        
        if (!data || typeof data.text !== 'string') {
          throw new Error('No text content found in PDF');
        }
        
        logger.debug('PDF parsing successful', { textLength: data.text.length }, 'TextExtractor');
        return data.text;
        
      } catch (pdfParseError) {
        logger.warn('pdf-parse failed, trying alternative approach', pdfParseError, 'TextExtractor');
        
        // For now, return empty string if PDF parsing fails
        // This allows the document to be uploaded without text content
        logger.info('PDF text extraction failed, uploading without text content', { 
          fileName: 'unknown', 
          error: pdfParseError instanceof Error ? pdfParseError.message : 'Unknown error' 
        }, 'TextExtractor');
        
        return `[PDF uploaded - text extraction failed: ${pdfParseError instanceof Error ? pdfParseError.message : 'Unknown error'}]`;
      }
      
    } catch (error) {
      logger.error('PDF text extraction completely failed', error, 'TextExtractor');
      
      // Return a placeholder instead of throwing
      return `[PDF uploaded - text extraction not available]`;
    }
  }

  /**
   * Extract text from Word documents using mammoth
   */
  private static async extractFromWord(buffer: Buffer): Promise<string> {
    try {
      // Import mammoth properly
      const mammoth = require('mammoth');
      
      // Extract text from Word document buffer
      const result = await mammoth.extractRawText({ buffer });
      
      if (!result || !result.value) {
        throw new Error('No text content found in Word document');
      }
      
      return result.value;
    } catch (error) {
      logger.error('Word document text extraction failed', error, 'TextExtractor');
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          throw new Error('Word document could not be processed');
        } else if (error.message.includes('Invalid')) {
          throw new Error('Invalid or corrupted Word document');
        } else {
          throw new Error(`Word document processing error: ${error.message}`);
        }
      }
      
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might cause issues
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Validate file type for text extraction
   */
  static isSupported(fileType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    return supportedTypes.includes(fileType);
  }

  /**
   * Get file type from file extension
   */
  static getFileTypeFromExtension(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }
}
