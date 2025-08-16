import { NextRequest } from 'next/server';
import { TeamResolver } from './team-resolver';
import { logger } from './logger';

/**
 * Utility for resolving team identifiers in API routes
 */
export class ApiTeamResolver {
  /**
   * Extract and resolve team ID from URL search params
   * Handles both 'teamId' and 'teamSlug' parameters for flexibility
   */
  static async getResolvedTeamId(request: NextRequest): Promise<string | null> {
    try {
      const url = new URL(request.url);
      
      // Check for teamId parameter (could be UUID or slug)
      let teamIdentifier = url.searchParams.get('teamId');
      
      // If no teamId, check for teamSlug parameter
      if (!teamIdentifier) {
        teamIdentifier = url.searchParams.get('teamSlug');
      }
      
      if (!teamIdentifier) {
        logger.warn('No team identifier found in API request', { url: request.url });
        return null;
      }

      // Resolve to actual team UUID
      const teamId = await TeamResolver.resolveTeamId(teamIdentifier);
      
      if (!teamId) {
        logger.warn('Could not resolve team identifier in API request', { 
          teamIdentifier,
          url: request.url 
        });
        return null;
      }

      logger.debug('Resolved team identifier in API request', { 
        teamIdentifier,
        resolvedTeamId: teamId 
      });

      return teamId;
    } catch (error) {
      logger.error('Error resolving team ID in API request', { 
        error,
        url: request.url 
      });
      return null;
    }
  }

  /**
   * Extract team identifier from path parameters
   * Useful for dynamic routes like /api/teams/[teamId]/...
   */
  static async getResolvedTeamIdFromPath(
    teamIdentifier: string
  ): Promise<string | null> {
    try {
      const teamId = await TeamResolver.resolveTeamId(teamIdentifier);
      
      if (!teamId) {
        logger.warn('Could not resolve team identifier from path', { teamIdentifier });
        return null;
      }

      logger.debug('Resolved team identifier from path', { 
        teamIdentifier,
        resolvedTeamId: teamId 
      });

      return teamId;
    } catch (error) {
      logger.error('Error resolving team ID from path', { 
        error,
        teamIdentifier 
      });
      return null;
    }
  }
}
