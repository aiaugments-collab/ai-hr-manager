import { NextRequest, NextResponse } from 'next/server';
import { CandidateService } from '@/lib/services/candidate-service';
import { ApiTeamResolver } from '@/lib/utils/api-team-resolver';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const apiTimer = logger.time('Candidates API Request', 'CandidatesAPI');
  
  try {
    logger.info('Candidates API request received', {}, 'CandidatesAPI');
    
    const teamId = await ApiTeamResolver.getResolvedTeamId(request);
    
    if (!teamId) {
      logger.warn('No team ID provided in candidates request', {}, 'CandidatesAPI');
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    logger.info('Fetching candidates for team', { teamId }, 'CandidatesAPI');
    
    const candidates = await CandidateService.getCandidates(teamId);
    
    logger.info('Candidates fetched successfully', { 
      teamId, 
      count: candidates.length 
    }, 'CandidatesAPI');

    apiTimer();
    
    return NextResponse.json({
      success: true,
      candidates: candidates,
      count: candidates.length
    });

  } catch (error) {
    apiTimer();
    logger.error('Error in candidates API', { error }, 'CandidatesAPI');

    return NextResponse.json(
      { 
        error: 'Failed to fetch candidates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
