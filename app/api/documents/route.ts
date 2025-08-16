import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document-service';
import { ApiTeamResolver } from '@/lib/utils/api-team-resolver';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const apiTimer = logger.time('Documents List API Request', 'DocumentsListAPI');
  
  try {
    logger.info('Documents list API request received', {}, 'DocumentsListAPI');
    
    const teamId = await ApiTeamResolver.getResolvedTeamId(request);
    
    // Validate required parameters
    if (!teamId) {
      logger.warn('No team ID provided in documents list request', {}, 'DocumentsListAPI');
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    logger.info('Fetching documents for team', { teamId }, 'DocumentsListAPI');
    
    // Get documents
    const documents = await DocumentService.getDocuments(teamId);
    
    logger.info('Documents fetched successfully', { 
      teamId, 
      documentCount: documents.length 
    }, 'DocumentsListAPI');
    
    apiTimer();
    
    return NextResponse.json({
      success: true,
      documents,
      totalCount: documents.length
    });
    
  } catch (error) {
    apiTimer();
    
    logger.error('Documents list API error', error, 'DocumentsListAPI');
    
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
