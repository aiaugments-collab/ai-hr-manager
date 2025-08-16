import { NextRequest, NextResponse } from 'next/server';
import { TeamSlugService } from '@/lib/services/team-slug-service';
import { TeamResolver } from '@/lib/utils/team-resolver';
import { logger } from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const apiTimer = logger.time('Create Team Slug API Request', 'CreateTeamSlugAPI');
  
  try {
    const resolvedParams = await params;
    logger.info('Create team slug API request received', { teamId: resolvedParams.teamId }, 'CreateTeamSlugAPI');
    
    const body = await request.json();
    const { displayName, preferredSlug } = body;
    
    if (!displayName) {
      logger.warn('No display name provided in create team slug request', { teamId: resolvedParams.teamId }, 'CreateTeamSlugAPI');
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    // Resolve team ID (in case they passed a slug)
    const teamId = await TeamResolver.resolveTeamId(resolvedParams.teamId);
    
    if (!teamId) {
      logger.warn('Could not resolve team ID', { teamIdentifier: resolvedParams.teamId }, 'CreateTeamSlugAPI');
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    logger.info('Creating slug for team', { teamId, displayName, preferredSlug }, 'CreateTeamSlugAPI');
    
    const result = await TeamSlugService.createOrUpdateTeamSlug(teamId, {
      displayName,
      preferredSlug
    });
    
    if (!result.success) {
      logger.warn('Failed to create team slug', { teamId, error: result.error }, 'CreateTeamSlugAPI');
      return NextResponse.json(
        { error: result.error || 'Failed to create team slug' },
        { status: 400 }
      );
    }

    logger.info('Team slug created successfully', { 
      teamId, 
      slug: result.slug 
    }, 'CreateTeamSlugAPI');

    apiTimer();
    
    return NextResponse.json({
      success: true,
      slug: result.slug,
      teamId: teamId
    });

  } catch (error) {
    apiTimer();
    const resolvedParams = await params;
    logger.error('Error in create team slug API', { error, teamId: resolvedParams.teamId }, 'CreateTeamSlugAPI');

    return NextResponse.json(
      { 
        error: 'Failed to create team slug',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const resolvedParams = await params;
    logger.info('Get team slug API request received', { teamId: resolvedParams.teamId });
    
    // Resolve team ID (in case they passed a slug)
    const teamId = await TeamResolver.resolveTeamId(resolvedParams.teamId);
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamSlug = await TeamSlugService.getTeamSlug(teamId);
    
    if (!teamSlug) {
      return NextResponse.json(
        { error: 'Team slug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teamSlug: teamSlug
    });

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Error in get team slug API', { error, teamId: resolvedParams.teamId });

    return NextResponse.json(
      { 
        error: 'Failed to get team slug',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
