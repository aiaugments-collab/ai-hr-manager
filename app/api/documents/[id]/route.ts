import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document-service';
import { logger } from '@/lib/utils/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const apiTimer = logger.time('Document Delete API Request', 'DocumentDeleteAPI');
  
  try {
    logger.info('Document delete API request received', { documentId: params.id }, 'DocumentDeleteAPI');
    
    const documentId = params.id;
    
    // Validate document ID
    if (!documentId || documentId.trim().length === 0) {
      logger.warn('No document ID provided in delete request', {}, 'DocumentDeleteAPI');
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    logger.info('Processing document deletion', { documentId }, 'DocumentDeleteAPI');
    
    // Delete document
    await DocumentService.deleteDocument(documentId);
    
    logger.info('Document deleted successfully', { documentId }, 'DocumentDeleteAPI');
    
    apiTimer();
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    apiTimer();
    
    logger.error('Document delete API error', error, 'DocumentDeleteAPI');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Handle specific error cases
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const apiTimer = logger.time('Document Get API Request', 'DocumentGetAPI');
  
  try {
    logger.info('Document get API request received', { documentId: params.id }, 'DocumentGetAPI');
    
    const documentId = params.id;
    
    // Validate document ID
    if (!documentId || documentId.trim().length === 0) {
      logger.warn('No document ID provided in get request', {}, 'DocumentGetAPI');
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    logger.info('Fetching document', { documentId }, 'DocumentGetAPI');
    
    // Get document
    const document = await DocumentService.getDocumentById(documentId);
    
    if (!document) {
      logger.warn('Document not found', { documentId }, 'DocumentGetAPI');
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    logger.info('Document fetched successfully', { documentId, name: document.name }, 'DocumentGetAPI');
    
    apiTimer();
    
    return NextResponse.json({
      success: true,
      document
    });
    
  } catch (error) {
    apiTimer();
    
    logger.error('Document get API error', error, 'DocumentGetAPI');
    
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
