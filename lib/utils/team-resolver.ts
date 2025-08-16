import { TeamSlugService } from '@/lib/services/team-slug-service';
import { logger } from '@/lib/utils/logger';

/**
 * Utility to resolve team identifier (slug or UUID) to team ID
 */
export class TeamResolver {
  /**
   * Resolve team identifier to UUID
   * Handles both slugs and direct UUIDs for backward compatibility
   */
  static async resolveTeamId(identifier: string): Promise<string | null> {
    try {
      // Check if it's already a UUID (Stack Auth team IDs are UUIDs)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(identifier)) {
        logger.debug('Team identifier is already UUID', { identifier });
        return identifier;
      }

      // Try to resolve as slug
      logger.debug('Resolving team slug to UUID', { slug: identifier });
      const teamId = await TeamSlugService.getTeamIdFromSlug(identifier);
      
      if (!teamId) {
        logger.warn('Could not resolve team identifier', { identifier });
        return null;
      }

      logger.debug('Successfully resolved team slug', { slug: identifier, teamId });
      return teamId;
    } catch (error) {
      logger.error('Error resolving team identifier', { identifier, error });
      return null;
    }
  }

  /**
   * Get the slug for a team ID, falling back to the ID if no slug exists
   */
  static async getTeamSlugOrId(teamId: string): Promise<string> {
    try {
      const slug = await TeamSlugService.getSlugFromTeamId(teamId);
      return slug || teamId;
    } catch (error) {
      logger.error('Error getting team slug', { teamId, error });
      return teamId;
    }
  }

  /**
   * Ensure a team has a slug, creating one if needed
   */
  static async ensureTeamSlug(teamId: string, displayName: string): Promise<string> {
    try {
      // Check if team already has a slug
      let slug = await TeamSlugService.getSlugFromTeamId(teamId);
      
      if (!slug) {
        logger.info('Creating slug for team without one', { teamId, displayName });
        const result = await TeamSlugService.createOrUpdateTeamSlug(teamId, { displayName });
        
        if (result.success && result.slug) {
          slug = result.slug;
          logger.info('Created slug for team', { teamId, slug });
        } else {
          logger.warn('Failed to create slug for team', { teamId, error: result.error });
          return teamId; // Fallback to UUID
        }
      }
      
      return slug || teamId;
    } catch (error) {
      logger.error('Error ensuring team slug', { teamId, error });
      return teamId;
    }
  }
}
