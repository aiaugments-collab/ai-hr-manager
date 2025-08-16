import pdf from 'pdf-parse';

export interface PDFProcessingResult {
  success: boolean;
  markdownContent?: string;
  error?: string;
  metadata?: {
    pages: number;
    info?: any;
  };
}

export class PDFProcessor {
  /**
   * Convert PDF buffer to markdown string
   */
  static async processPDF(buffer: Buffer, fileName: string): Promise<PDFProcessingResult> {
    try {
      // Parse PDF
      const data = await pdf(buffer);
      
      if (!data.text || data.text.trim().length === 0) {
        return {
          success: false,
          error: 'PDF appears to be empty or contains no extractable text'
        };
      }

      // Convert to markdown
      const markdownContent = this.convertToMarkdown(data.text, fileName);

      return {
        success: true,
        markdownContent,
        metadata: {
          pages: data.numpages,
          info: data.info
        }
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PDF processing error'
      };
    }
  }

  /**
   * Convert raw text to structured markdown
   */
  private static convertToMarkdown(text: string, fileName: string): string {
    // Clean up the text
    let cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();

    // Add document header
    let markdown = `# ${fileName.replace('.pdf', '')}\n\n`;

    // Split into sections and process
    const lines = cleanText.split('\n');
    let processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length === 0) {
        processedLines.push('');
        continue;
      }

      // Detect potential headers (all caps, short lines, etc.)
      if (this.isLikelyHeader(line)) {
        processedLines.push(`## ${line}`);
      }
      // Detect email addresses
      else if (this.containsEmail(line)) {
        processedLines.push(`**Contact:** ${line}`);
      }
      // Detect phone numbers
      else if (this.containsPhone(line)) {
        processedLines.push(`**Phone:** ${line}`);
      }
      // Detect dates (likely work experience)
      else if (this.containsDateRange(line)) {
        processedLines.push(`**Duration:** ${line}`);
      }
      // Regular content
      else {
        processedLines.push(line);
      }
    }

    markdown += processedLines.join('\n');

    return markdown;
  }

  /**
   * Check if a line is likely a header
   */
  private static isLikelyHeader(line: string): boolean {
    // Check for common header patterns
    const headerPatterns = [
      /^[A-Z\s]{3,}$/, // All caps
      /^(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|OBJECTIVE|CONTACT|PROJECTS|CERTIFICATIONS)/i,
      /^[A-Z][a-z\s]+:$/, // Title case ending with colon
    ];

    return headerPatterns.some(pattern => pattern.test(line)) && line.length < 50;
  }

  /**
   * Check if line contains email
   */
  private static containsEmail(line: string): boolean {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    return emailRegex.test(line);
  }

  /**
   * Check if line contains phone number
   */
  private static containsPhone(line: string): boolean {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    return phoneRegex.test(line);
  }

  /**
   * Check if line contains date range (work experience)
   */
  private static containsDateRange(line: string): boolean {
    const dateRangeRegex = /(19|20)\d{2}[\s\-–—to]*((19|20)\d{2}|present|current)/i;
    return dateRangeRegex.test(line);
  }

  /**
   * Validate PDF file
   */
  static validatePDF(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    return { valid: true };
  }
}
