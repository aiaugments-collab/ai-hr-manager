import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document-service';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const apiTimer = logger.time('Document Upload API Request', 'DocumentUploadAPI');
  
  try {
    logger.info('Document upload API request received', {}, 'DocumentUploadAPI');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string;
    const createdBy = formData.get('createdBy') as string;
    
    // Validate required fields
    if (!file) {
      logger.warn('No file provided in upload request', {}, 'DocumentUploadAPI');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!teamId) {
      logger.warn('No team ID provided in upload request', {}, 'DocumentUploadAPI');
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    if (!createdBy) {
      logger.warn('No creator ID provided in upload request', {}, 'DocumentUploadAPI');
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }
    
    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      logger.warn('File size exceeds limit', { 
        fileName: file.name, 
        size: file.size, 
        maxSize 
      }, 'DocumentUploadAPI');
      
      return NextResponse.json(
        { error: 'File size must be less than 20MB' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      logger.warn('Unsupported file type', { 
        fileName: file.name, 
        fileType: file.type 
      }, 'DocumentUploadAPI');
      
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.' },
        { status: 400 }
      );
    }
    
    logger.info('Processing document upload', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      teamId,
      createdBy
    }, 'DocumentUploadAPI');
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload and process document
    const result = await DocumentService.uploadDocument(
      buffer,
      file.name,
      file.type,
      teamId,
      createdBy
    );
    
    if (!result.success) {
      logger.error('Document upload failed', { 
        fileName: file.name, 
        error: result.error 
      }, 'DocumentUploadAPI');
      
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }
    
    logger.info('Document upload completed successfully', {
      fileName: file.name,
      documentId: result.document?.id,
      textLength: result.document?.textContent.length
    }, 'DocumentUploadAPI');
    
    apiTimer();
    
    return NextResponse.json({
      success: true,
      document: result.document,
      message: 'Document uploaded and processed successfully'
    });
    
  } catch (error) {
    apiTimer();
    
    logger.error('Document upload API error', error, 'DocumentUploadAPI');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
