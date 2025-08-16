import { TeamSlugService } from '@/lib/services/team-slug-service';
import { logger } from '@/lib/utils/logger';

/**
 * Utility to migrate existing teams to have slugs
 * This can be called when teams don't have slugs yet
 */
export class TeamSlugMigration {
  /**
   * Create slug for a team if it doesn't exist
   */
  static async ensureTeamHasSlug(
    teamId: string, 
    displayName: string
  ): Promise<string> {
    try {
      // Check if team already has a slug
      const existingSlug = await TeamSlugService.getSlugFromTeamId(teamId);
      
      if (existingSlug) {
        logger.debug('Team already has slug', { teamId, slug: existingSlug });
        return existingSlug;
      }

      // Create new slug
      logger.info('Creating slug for team', { teamId, displayName });
      
      const result = await TeamSlugService.createOrUpdateTeamSlug(teamId, {
        displayName
      });

      if (result.success && result.slug) {
        logger.info('Successfully created slug for team', { 
          teamId, 
          slug: result.slug 
        });
        return result.slug;
      } else {
        logger.warn('Failed to create slug, using team ID as fallback', { 
          teamId, 
          error: result.error 
        });
        return teamId;
      }
    } catch (error) {
      logger.error('Error ensuring team has slug', { teamId, error });
      return teamId; // Fallback to UUID
    }
  }

  /**
   * Migrate multiple teams to have slugs
   */
  static async migrateTeams(
    teams: Array<{ id: string; displayName: string }>
  ): Promise<Array<{ teamId: string; slug: string; success: boolean }>> {
    logger.info('Starting team slug migration', { teamCount: teams.length });
    
    const results = [];
    
    for (const team of teams) {
      try {
        const slug = await this.ensureTeamHasSlug(team.id, team.displayName);
        results.push({
          teamId: team.id,
          slug,
          success: true
        });
      } catch (error) {
        logger.error('Failed to migrate team', { teamId: team.id, error });
        results.push({
          teamId: team.id,
          slug: team.id,
          success: false
        });
      }
    }
    
    logger.info('Team slug migration completed', { 
      total: teams.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
    return results;
  }
}
