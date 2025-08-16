import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Candidate, CandidateStats } from '@/lib/types/candidate';
import { logger } from '@/lib/utils/logger';

// Using logger with context 'CandidateService'

export class CandidateService {
  private static readonly COLLECTION_NAME = 'candidates';

  /**
   * Get all candidates for a team
   */
  static async getCandidates(teamId: string): Promise<Candidate[]> {
    const timer = logger.time('Get candidates');
    
    try {
      logger.info('Fetching candidates from Firestore', { teamId });
      
      const candidatesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        candidatesRef,
        where('teamId', '==', teamId)
      );
      
      const querySnapshot = await getDocs(q);
      const candidates: Candidate[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const candidate: Candidate = {
          id: doc.id,
          teamId: data.teamId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          position: data.position,
          experience: data.experience,
          score: data.score,
          status: data.status,
          skills: data.skills || [],
          education: data.education || [],
          workExperience: data.workExperience || [],
          summary: data.summary,
          aiAnalysis: data.aiAnalysis,
          cvUrl: data.cvUrl,
          // Convert Firestore timestamps to Date objects
          uploadedAt: data.uploadedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        candidates.push(candidate);
      });
      
      // Sort candidates by uploadedAt in descending order (newest first)
      candidates.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
      
      logger.info('Candidates fetched successfully', { 
        teamId, 
        count: candidates.length,
        candidateNames: candidates.map(c => c.name)
      });
      
      timer();
      return candidates;
      
    } catch (error) {
      timer();
      logger.error('Failed to fetch candidates', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Please check your access rights';
        } else if (error.message.includes('not-found')) {
          errorMessage = 'Database not found. Please check your configuration';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection';
        } else if (error.message.includes('quota')) {
          errorMessage = 'Database quota exceeded. Please try again later';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(`Failed to fetch candidates: ${errorMessage}`);
    }
  }

  /**
   * Get a single candidate by ID
   */
  static async getCandidateById(candidateId: string): Promise<Candidate | null> {
    const timer = logger.time('Get candidate by ID');
    
    try {
      logger.info('Fetching candidate by ID', { candidateId });
      
      const candidateRef = doc(db, this.COLLECTION_NAME, candidateId);
      const candidateSnap = await getDoc(candidateRef);
      
      if (!candidateSnap.exists()) {
        logger.warn('Candidate not found', { candidateId });
        timer();
        return null;
      }
      
      const data = candidateSnap.data();
      const candidate: Candidate = {
        id: candidateSnap.id,
        teamId: data.teamId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        experience: data.experience,
        score: data.score,
        status: data.status,
        skills: data.skills || [],
        education: data.education || [],
        workExperience: data.workExperience || [],
        summary: data.summary,
        aiAnalysis: data.aiAnalysis,
        cvUrl: data.cvUrl,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      logger.info('Candidate fetched successfully', { 
        candidateId, 
        candidateName: candidate.name 
      });
      
      timer();
      return candidate;
      
    } catch (error) {
      timer();
      logger.error('Failed to fetch candidate by ID', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Please check your access rights';
        } else if (error.message.includes('not-found')) {
          errorMessage = 'Candidate not found in database';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(`Failed to fetch candidate: ${errorMessage}`);
    }
  }

  /**
   * Update candidate status
   */
  static async updateCandidateStatus(
    candidateId: string, 
    status: Candidate['status']
  ): Promise<void> {
    const timer = logger.time('Update candidate status');
    
    try {
      logger.info('Updating candidate status', { candidateId, status });
      
      const candidateRef = doc(db, this.COLLECTION_NAME, candidateId);
      await updateDoc(candidateRef, {
        status,
        updatedAt: new Date()
      });
      
      logger.info('Candidate status updated successfully', { candidateId, status });
      timer();
      
    } catch (error) {
      timer();
      logger.error('Failed to update candidate status', error);
      throw new Error(`Failed to update candidate status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a candidate
   */
  static async deleteCandidate(candidateId: string): Promise<void> {
    const timer = logger.time('Delete candidate');
    
    try {
      logger.info('Deleting candidate', { candidateId });
      
      const candidateRef = doc(db, this.COLLECTION_NAME, candidateId);
      await deleteDoc(candidateRef);
      
      logger.info('Candidate deleted successfully', { candidateId });
      timer();
      
    } catch (error) {
      timer();
      logger.error('Failed to delete candidate', error);
      throw new Error(`Failed to delete candidate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate candidate statistics
   */
  static calculateStats(candidates: Candidate[]): CandidateStats {
    logger.debug('Calculating candidate statistics', { totalCandidates: candidates.length });
    
    const stats: CandidateStats = {
      total: candidates.length,
      new: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
      averageScore: 0,
      highScoreCount: 0
    };

    if (candidates.length === 0) {
      return stats;
    }

    let totalScore = 0;

    candidates.forEach(candidate => {
      // Count by status
      switch (candidate.status) {
        case 'new':
          stats.new++;
          break;
        case 'reviewed':
          stats.reviewed++;
          break;
        case 'shortlisted':
          stats.shortlisted++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
      }

      // Calculate score statistics
      totalScore += candidate.score;
      if (candidate.score >= 80) {
        stats.highScoreCount++;
      }
    });

    stats.averageScore = Math.round(totalScore / candidates.length);

    logger.debug('Statistics calculated', stats);
    return stats;
  }

  /**
   * Get candidates with filters (client-side filtering for now)
   */
  static filterCandidates(
    candidates: Candidate[],
    filters: {
      search?: string;
      status?: Candidate['status'] | 'all';
      minScore?: number;
      maxScore?: number;
      experienceLevel?: string | 'all';
      role?: string | 'all';
    }
  ): Candidate[] {
    logger.debug('Filtering candidates', { 
      totalCandidates: candidates.length, 
      filters 
    });

    let filtered = [...candidates];

    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.position.toLowerCase().includes(searchLower) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === filters.status);
    }

    // Score range filter
    if (filters.minScore !== undefined) {
      filtered = filtered.filter(candidate => candidate.score >= filters.minScore!);
    }
    if (filters.maxScore !== undefined) {
      filtered = filtered.filter(candidate => candidate.score <= filters.maxScore!);
    }

    // Experience level filter
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      filtered = filtered.filter(candidate => 
        candidate.aiAnalysis.experienceLevel === filters.experienceLevel
      );
    }

    // Role filter (position-based)
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(candidate => 
        candidate.position.toLowerCase().includes(filters.role!.toLowerCase())
      );
    }

    logger.debug('Candidates filtered', { 
      originalCount: candidates.length,
      filteredCount: filtered.length 
    });

    return filtered;
  }
}
