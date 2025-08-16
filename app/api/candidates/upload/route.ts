import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini-service';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const apiTimer = logger.time('Upload API Request', 'UploadAPI');
  
  try {
    logger.info('Upload API request received');
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const teamId = formData.get('teamId') as string;

    logger.info('Request data parsed', { 
      fileCount: files.length, 
      teamId,
      fileNames: files.map(f => f.name)
    });

    if (!teamId) {
      logger.warn('Upload request missing team ID');
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      logger.warn('Upload request with no files');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate all files first
    const validFiles: { buffer: Buffer; fileName: string; file: File }[] = [];
    const results = [];

    for (const file of files) {
      const validation = GeminiService.validatePDF(file);
      if (!validation.valid) {
        results.push({
          fileName: file.name,
          success: false,
          error: validation.error
        });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        validFiles.push({ buffer, fileName: file.name, file });
      } catch (error) {
        results.push({
          fileName: file.name,
          success: false,
          error: 'Failed to read file'
        });
      }
    }

    if (validFiles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid files to process',
        results,
        summary: {
          total: results.length,
          successful: 0,
          failed: results.length
        }
      });
    }

    // Process files in parallel batches with Gemini
    const geminiResults = await GeminiService.processPDFsBatch(
      validFiles.map(({ buffer, fileName }) => ({ buffer, fileName })),
      8 // Process 8 files in parallel
    );

    // Save successful results to Firestore
    for (let i = 0; i < geminiResults.length; i++) {
      const result = geminiResults[i];
      const originalFile = validFiles[i].file;

      if (result.success && result.candidate) {
        try {
          // Create candidate document in Firestore - clean undefined values
          const candidateData = {
            id: uuidv4(),
            teamId,
            name: result.candidate.name || 'Unknown',
            email: result.candidate.email || '',
            phone: result.candidate.phone || null, // Use null instead of undefined
            position: result.candidate.position || 'Not specified',
            experience: result.candidate.experience || 0,
            score: result.candidate.score || 0,
            status: result.candidate.status || 'new',
            skills: result.candidate.skills || [],
            education: result.candidate.education || [],
            workExperience: result.candidate.workExperience || [],
            summary: result.candidate.summary || '',
            aiAnalysis: result.candidate.aiAnalysis || {
              skillsMatch: 0,
              experienceLevel: 'Junior',
              strengths: [],
              weaknesses: [],
              recommendation: 'No analysis available',
              keyHighlights: []
            },
            uploadedAt: serverTimestamp(),
            cvUrl: `processed-${Date.now()}-${result.fileName}`, // Placeholder since we don't store the actual PDF
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          const docRef = await addDoc(collection(db, 'candidates'), candidateData);

          results.push({
            fileName: result.fileName,
            success: true,
            candidateId: docRef.id,
            candidate: result.candidate,
            score: result.candidate.score
          });

        } catch (error) {
          logger.error(`Failed to save candidate ${result.fileName}`, error);
          results.push({
            fileName: result.fileName,
            success: false,
            error: 'Failed to save candidate data'
          });
        }
      } else {
        logger.warn(`AI processing failed for ${result.fileName}`, { error: result.error });
        results.push({
          fileName: result.fileName,
          success: false,
          error: result.error || 'AI processing failed'
        });
      }
    }

    // Return results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Upload API request completed', {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results: results.map(r => ({ fileName: r.fileName, success: r.success }))
    });

    apiTimer();

    // Create detailed message
    let message = '';
    if (successCount === results.length) {
      message = `All ${results.length} files processed successfully!`;
    } else if (successCount > 0) {
      message = `${successCount} of ${results.length} files processed successfully. ${failureCount} failed.`;
    } else {
      message = `All ${results.length} files failed to process. Please check the files and try again.`;
    }

    return NextResponse.json({
      success: successCount > 0, // Consider partial success as success
      message,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        errors: results.filter(r => !r.success).map(r => ({ fileName: r.fileName, error: r.error }))
      }
    });

  } catch (error) {
    apiTimer();
    logger.error('Upload API error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Upload endpoint - use POST to upload files' },
    { status: 200 }
  );
}
