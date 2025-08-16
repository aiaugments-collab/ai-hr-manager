import { GoogleGenerativeAI } from '@google/generative-ai';
import { Candidate } from '@/lib/types/candidate';
import { CustomParser, ParsedCandidate } from '@/lib/utils/custom-parser';
import { createLogger } from '@/lib/utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiProcessingResult {
  success: boolean;
  candidate?: Omit<Candidate, 'id' | 'teamId' | 'uploadedAt' | 'cvUrl'>;
  error?: string;
  fileName: string;
}

export class GeminiService {
  private static model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private static logger = createLogger('GeminiService');

  /**
   * Process PDF file directly with Gemini and extract candidate data
   */
  static async processPDFToCandidate(
    buffer: Buffer, 
    fileName: string
  ): Promise<GeminiProcessingResult> {
    const timer = this.logger.time(`Processing PDF: ${fileName}`);
    
    try {
      this.logger.info('Starting PDF processing', { fileName, bufferSize: buffer.length });
      
      const prompt = this.buildCandidateExtractionPrompt();
      
      // Convert buffer to base64 for Gemini
      const base64Data = buffer.toString('base64');
      this.logger.debug('PDF converted to base64', { fileName, base64Length: base64Data.length });
      
      this.logger.info('Sending request to Gemini API', { fileName });
      const result = await this.model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        },
        prompt
      ]);

      const response = await result.response;
      const text = response.text();
      this.logger.debug('Received response from Gemini', { fileName, responseLength: text.length });

      // Parse custom delimited response
      const candidateData = CustomParser.parseDelimitedData(text);
      
      if (!candidateData) {
        this.logger.error('Failed to parse candidate data from AI response', { fileName, rawResponse: text });
        return {
          success: false,
          error: 'Failed to parse candidate data from AI response',
          fileName
        };
      }

      // Validate parsed data
      const validation = CustomParser.validateParsedData(candidateData);
      if (!validation.valid) {
        this.logger.warn('Parsed data validation failed', { fileName, errors: validation.errors, data: candidateData });
      }

      // Structure the candidate data
      const candidate = this.validateAndStructureCandidate(candidateData, fileName);
      
      this.logger.info('PDF processing completed successfully', { 
        fileName, 
        candidateName: candidate.name,
        score: candidate.score 
      });
      
      timer();
      return {
        success: true,
        candidate,
        fileName
      };

    } catch (error) {
      timer();
      this.logger.error(`Gemini processing failed for ${fileName}`, error);
      
      let errorMessage = 'Unknown Gemini processing error';
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('API_KEY')) {
          errorMessage = 'Invalid Gemini API key configuration';
        } else if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
          errorMessage = 'Gemini API quota exceeded. Please try again later';
        } else if (error.message.includes('rate limit') || error.message.includes('RATE_LIMIT_EXCEEDED')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment';
        } else if (error.message.includes('SAFETY')) {
          errorMessage = 'Content blocked by safety filters. Please check the CV content';
        } else if (error.message.includes('INVALID_ARGUMENT')) {
          errorMessage = 'Invalid file format or corrupted PDF';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. The file may be too large or complex';
        } else if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'Permission denied. Please check API configuration';
        } else {
          errorMessage = `AI processing error: ${error.message}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        fileName
      };
    }
  }

  /**
   * Process multiple PDFs in parallel batches
   */
  static async processPDFsBatch(
    files: { buffer: Buffer; fileName: string }[],
    batchSize: number = 8
  ): Promise<GeminiProcessingResult[]> {
    this.logger.info('Starting batch processing', { 
      totalFiles: files.length, 
      batchSize,
      fileNames: files.map(f => f.fileName)
    });
    
    const results: GeminiProcessingResult[] = [];
    const totalBatches = Math.ceil(files.length / batchSize);
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < files.length; i += batchSize) {
      const batchNumber = Math.floor(i / batchSize) + 1;
      const batch = files.slice(i, i + batchSize);
      
      this.logger.info(`Processing batch ${batchNumber}/${totalBatches}`, {
        batchFiles: batch.map(f => f.fileName),
        batchSize: batch.length
      });
      
      const batchTimer = this.logger.time(`Batch ${batchNumber}`);
      
      const batchPromises = batch.map(({ buffer, fileName }) =>
        this.processPDFToCandidate(buffer, fileName)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      batchTimer();
      
      const successCount = batchResults.filter(r => r.success).length;
      this.logger.info(`Batch ${batchNumber} completed`, {
        successful: successCount,
        failed: batchResults.length - successCount,
        results: batchResults.map(r => ({ fileName: r.fileName, success: r.success }))
      });
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < files.length) {
        this.logger.debug('Waiting between batches', { delay: '1000ms' });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const totalSuccess = results.filter(r => r.success).length;
    this.logger.info('Batch processing completed', {
      totalFiles: files.length,
      successful: totalSuccess,
      failed: results.length - totalSuccess
    });
    
    return results;
  }

  /**
   * Build the prompt for candidate data extraction
   */
  private static buildCandidateExtractionPrompt(): string {
    return `
You are an expert HR assistant. Analyze this CV/Resume PDF and extract structured candidate information.

IMPORTANT: Return your response in this EXACT format with delimiters (NO JSON SYNTAX):

===CANDIDATE_DATA_START===
NAME: Full Name Here
EMAIL: email@example.com
PHONE: phone number or NONE
POSITION: Most relevant job title
EXPERIENCE_YEARS: number only
SCORE: number 0-100
SUMMARY: Brief 2-3 sentence professional summary

SKILLS_START:
skill1
skill2  
skill3
skill4
SKILLS_END:

EDUCATION_START:
DEGREE: Degree Name | INSTITUTION: University Name | YEAR: 2020 | FIELD: Field of Study
DEGREE: Another Degree | INSTITUTION: Another School | YEAR: 2018 | FIELD: Another Field
EDUCATION_END:

WORK_START:
COMPANY: Company Name | POSITION: Job Title | START: 2020-01 | END: Present | DURATION: 4 years | DESC: Brief description of role and key achievements
COMPANY: Previous Company | POSITION: Previous Role | START: 2018-06 | END: 2019-12 | DURATION: 1 year 6 months | DESC: Description of previous role
WORK_END:

ANALYSIS_START:
SKILLS_MATCH: number 0-100
EXPERIENCE_LEVEL: Junior OR Mid-level OR Senior OR Expert
STRENGTHS: strength1 | strength2 | strength3
WEAKNESSES: weakness1 | weakness2
RECOMMENDATION: Brief hiring recommendation
HIGHLIGHTS: highlight1 | highlight2 | highlight3
ANALYSIS_END:
===CANDIDATE_DATA_END===

SCORING CRITERIA (0-100):
- Technical Skills Relevance: 30 points
- Experience Level & Quality: 25 points  
- Education Background: 15 points
- Career Progression: 15 points
- Communication & Presentation: 15 points

INSTRUCTIONS:
1. Extract ALL information accurately from the PDF
2. Calculate a fair score based on the criteria above
3. Use NONE if information is not available
4. Use Present for current positions
5. Separate multiple items with | symbol
6. Return ONLY the data within the delimiters, no other text
7. Follow the format EXACTLY as shown

Analyze the CV now:
`;
  }



  /**
   * Validate and structure candidate data
   */
  private static validateAndStructureCandidate(data: ParsedCandidate, fileName: string): Omit<Candidate, 'id' | 'teamId' | 'uploadedAt' | 'cvUrl'> {
    return {
      name: data.name || 'Unknown',
      email: data.email || '',
      phone: data.phone || null,
      position: data.position || 'Not specified',
      experience: Math.max(0, data.experience || 0),
      score: Math.min(100, Math.max(0, data.score || 0)),
      status: 'new',
      skills: data.skills || [],
      education: data.education || [],
      workExperience: data.workExperience || [],
      summary: data.summary || `Candidate from ${fileName}`,
      aiAnalysis: {
        skillsMatch: Math.min(100, Math.max(0, data.aiAnalysis?.skillsMatch || 0)),
        experienceLevel: (data.aiAnalysis?.experienceLevel && 
          ['Junior', 'Mid-level', 'Senior', 'Expert'].includes(data.aiAnalysis.experienceLevel)) 
          ? data.aiAnalysis.experienceLevel as 'Junior' | 'Mid-level' | 'Senior' | 'Expert'
          : 'Mid-level',
        strengths: data.aiAnalysis?.strengths || [],
        weaknesses: data.aiAnalysis?.weaknesses || [],
        recommendation: data.aiAnalysis?.recommendation || 'Requires manual review',
        keyHighlights: data.aiAnalysis?.keyHighlights || []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Validate PDF file for Gemini processing
   */
  static validatePDF(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF' };
    }

    // Check file size (20MB limit for Gemini)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 20MB for AI processing' };
    }

    return { valid: true };
  }
}
