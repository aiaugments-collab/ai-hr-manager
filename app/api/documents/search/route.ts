import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document-service';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const apiTimer = logger.time('Document Search API Request', 'DocumentSearchAPI');
  
  try {
    logger.info('Document search API request received', {}, 'DocumentSearchAPI');
    
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const query = searchParams.get('query');
    
    // Validate required parameters
    if (!teamId) {
      logger.warn('No team ID provided in search request', {}, 'DocumentSearchAPI');
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    if (!query || query.trim().length === 0) {
      logger.warn('No search query provided', { teamId }, 'DocumentSearchAPI');
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Validate query length
    if (query.length > 200) {
      logger.warn('Search query too long', { teamId, queryLength: query.length }, 'DocumentSearchAPI');
      return NextResponse.json(
        { error: 'Search query must be less than 200 characters' },
        { status: 400 }
      );
    }
    
    logger.info('Processing document search', { teamId, query }, 'DocumentSearchAPI');
    
    // Search documents
    const searchResults = await DocumentService.searchDocuments(teamId, query);
    
    logger.info('Document search completed', { 
      teamId, 
      query, 
      resultCount: searchResults.length 
    }, 'DocumentSearchAPI');
    
    apiTimer();
    
    return NextResponse.json({
      success: true,
      results: searchResults,
      query,
      totalResults: searchResults.length
    });
    
  } catch (error) {
    apiTimer();
    
    logger.error('Document search API error', error, 'DocumentSearchAPI');
    
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
