import { NextRequest, NextResponse } from 'next/server';
import { TeamSlugService } from '@/lib/services/team-slug-service';
import { logger } from '@/lib/utils/logger';

/**
 * Simple API to create a slug for an existing team
 * Call this once to migrate your existing team to use slugs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, displayName } = body;
    
    if (!teamId || !displayName) {
      return NextResponse.json(
        { error: 'teamId and displayName are required' },
        { status: 400 }
      );
    }

    logger.info('Creating slug for existing team', { teamId, displayName });
    
    const result = await TeamSlugService.createOrUpdateTeamSlug(teamId, {
      displayName
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create team slug' },
        { status: 400 }
      );
    }

    logger.info('Team slug created successfully', { 
      teamId, 
      slug: result.slug 
    });
    
    return NextResponse.json({
      success: true,
      slug: result.slug,
      message: `Team slug created! You can now use /dashboard/${result.slug}`
    });

  } catch (error) {
    logger.error('Error creating team slug', { error });
    return NextResponse.json(
      { 
        error: 'Failed to create team slug',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
