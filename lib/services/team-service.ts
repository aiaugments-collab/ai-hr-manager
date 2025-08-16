import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

export interface TeamSlugMapping {
  id: string;
  teamId: string; // Stack Auth team ID
  slug: string;   // Human readable slug
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamService {
  private static readonly COLLECTION_NAME = 'team_slugs';

  /**
   * Generate a slug from team display name
   */
  static generateSlug(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
      .slice(0, 50);                // Limit length
  }

  /**
   * Create or update team slug mapping
   */
  static async createTeamSlug(teamId: string, displayName: string): Promise<string> {
    try {
      logger.info('Creating team slug', { teamId, displayName }, 'TeamService');
      
      // Check if mapping already exists
      const existing = await this.getTeamByStackId(teamId);
      if (existing) {
        logger.info('Team slug already exists', { teamId, slug: existing.slug }, 'TeamService');
        return existing.slug;
      }

      // Generate base slug
      let baseSlug = this.generateSlug(displayName);
      if (!baseSlug) {
        baseSlug = 'team'; // Fallback for empty names
      }

      // Ensure uniqueness
      let finalSlug = baseSlug;
      let counter = 1;
      
      while (await this.slugExists(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create mapping
      const mapping: Omit<TeamSlugMapping, 'id'> = {
        teamId,
        slug: finalSlug,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(db, this.COLLECTION_NAME, finalSlug);
      await setDoc(docRef, mapping);

      logger.info('Team slug created successfully', { teamId, slug: finalSlug }, 'TeamService');
      return finalSlug;

    } catch (error) {
      logger.error('Failed to create team slug', error, 'TeamService');
      throw new Error(`Failed to create team slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get team by slug
   */
  static async getTeamBySlug(slug: string): Promise<TeamSlugMapping | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, slug);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        teamId: data.teamId,
        slug: data.slug,
        displayName: data.displayName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };

    } catch (error) {
      logger.error('Failed to get team by slug', error, 'TeamService');
      return null;
    }
  }

  /**
   * Get team by Stack Auth team ID
   */
  static async getTeamByStackId(teamId: string): Promise<TeamSlugMapping | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('teamId', '==', teamId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        teamId: data.teamId,
        slug: data.slug,
        displayName: data.displayName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };

    } catch (error) {
      logger.error('Failed to get team by Stack ID', error, 'TeamService');
      return null;
    }
  }

  /**
   * Check if slug already exists
   */
  private static async slugExists(slug: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, slug);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      logger.error('Failed to check slug existence', error, 'TeamService');
      return false;
    }
  }

  /**
   * Update team slug (if needed)
   */
  static async updateTeamSlug(currentSlug: string, newDisplayName: string): Promise<string> {
    try {
      const existing = await this.getTeamBySlug(currentSlug);
      if (!existing) {
        throw new Error('Team not found');
      }

      const newSlug = this.generateSlug(newDisplayName);
      
      // If slug hasn't changed, just update display name
      if (newSlug === currentSlug) {
        const docRef = doc(db, this.COLLECTION_NAME, currentSlug);
        await setDoc(docRef, {
          ...existing,
          displayName: newDisplayName,
          updatedAt: new Date()
        });
        return currentSlug;
      }

      // Create new slug mapping and delete old one
      await this.createTeamSlug(existing.teamId, newDisplayName);
      
      // Note: You might want to keep old slug for redirects instead of deleting
      // const oldDocRef = doc(db, this.COLLECTION_NAME, currentSlug);
      // await deleteDoc(oldDocRef);

      return newSlug;

    } catch (error) {
      logger.error('Failed to update team slug', error, 'TeamService');
      throw new Error(`Failed to update team slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
