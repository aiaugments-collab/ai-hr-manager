import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { TeamSlug, SlugGenerationOptions } from '@/lib/types/team';
import { generateSlugFromName, generateUniqueSlug, validateSlug } from '@/lib/utils/slug-generator';
import { logger } from '@/lib/utils/logger';

export class TeamSlugService {
  private static readonly COLLECTION_NAME = 'team_slugs';

  /**
   * Get team ID from slug
   */
  static async getTeamIdFromSlug(slug: string): Promise<string | null> {
    try {
      logger.info('Resolving team slug to ID', { slug });
      
      const slugsRef = collection(db, this.COLLECTION_NAME);
      const q = query(slugsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        logger.warn('Team slug not found', { slug });
        return null;
      }
      
      const teamSlugDoc = querySnapshot.docs[0];
      const teamSlug = teamSlugDoc.data() as TeamSlug;
      
      logger.info('Team slug resolved', { slug, teamId: teamSlug.id });
      return teamSlug.id;
    } catch (error) {
      logger.error('Error resolving team slug', { slug, error });
      return null;
    }
  }

  /**
   * Get slug from team ID
   */
  static async getSlugFromTeamId(teamId: string): Promise<string | null> {
    try {
      logger.debug('Getting slug for team ID', { teamId });
      
      const docRef = doc(db, this.COLLECTION_NAME, teamId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        logger.warn('Team slug not found for team ID', { teamId });
        return null;
      }
      
      const teamSlug = docSnap.data() as TeamSlug;
      logger.debug('Found slug for team', { teamId, slug: teamSlug.slug });
      return teamSlug.slug;
    } catch (error) {
      logger.error('Error getting slug for team ID', { teamId, error });
      return null;
    }
  }

  /**
   * Create or update team slug
   */
  static async createOrUpdateTeamSlug(
    teamId: string, 
    options: SlugGenerationOptions
  ): Promise<{ success: boolean; slug?: string; error?: string }> {
    try {
      logger.info('Creating/updating team slug', { teamId, displayName: options.displayName });
      
      // Check if team already has a slug
      const existingSlug = await this.getSlugFromTeamId(teamId);
      if (existingSlug) {
        logger.info('Team already has slug', { teamId, existingSlug });
        return { success: true, slug: existingSlug };
      }

      // Generate base slug
      const baseSlug = options.preferredSlug 
        ? options.preferredSlug 
        : generateSlugFromName(options.displayName);

      // Validate the base slug
      const validation = validateSlug(baseSlug);
      if (!validation.valid) {
        logger.warn('Invalid slug generated', { baseSlug, error: validation.error });
        return { success: false, error: validation.error };
      }

      // Get all existing slugs to ensure uniqueness
      const existingSlugs = await this.getAllExistingSlugs();
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

      // Create the team slug document
      const teamSlugData: Omit<TeamSlug, 'createdAt' | 'updatedAt'> & {
        createdAt: any;
        updatedAt: any;
      } = {
        id: teamId,
        slug: uniqueSlug,
        displayName: options.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, this.COLLECTION_NAME, teamId);
      await setDoc(docRef, teamSlugData);

      logger.info('Team slug created successfully', { 
        teamId, 
        slug: uniqueSlug, 
        displayName: options.displayName 
      });

      return { success: true, slug: uniqueSlug };
    } catch (error) {
      logger.error('Error creating team slug', { teamId, error });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get all existing slugs for uniqueness checking
   */
  private static async getAllExistingSlugs(): Promise<string[]> {
    try {
      const slugsRef = collection(db, this.COLLECTION_NAME);
      const querySnapshot = await getDocs(slugsRef);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as TeamSlug;
        return data.slug;
      });
    } catch (error) {
      logger.error('Error fetching existing slugs', { error });
      return [];
    }
  }

  /**
   * Check if a slug is available
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      const validation = validateSlug(slug);
      if (!validation.valid) {
        return false;
      }

      const existingSlugs = await this.getAllExistingSlugs();
      return !existingSlugs.includes(slug);
    } catch (error) {
      logger.error('Error checking slug availability', { slug, error });
      return false;
    }
  }

  /**
   * Get team slug data
   */
  static async getTeamSlug(teamId: string): Promise<TeamSlug | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, teamId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return docSnap.data() as TeamSlug;
    } catch (error) {
      logger.error('Error getting team slug data', { teamId, error });
      return null;
    }
  }
}
