import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TeamResolver } from '@/lib/utils/team-resolver';
import { logger } from '@/lib/utils/logger';

export interface UseTeamSlugResult {
  teamId: string | null;
  teamSlug: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to resolve team slug/ID from URL parameters
 * Handles both slug and UUID formats for backward compatibility
 */
export function useTeamSlug(): UseTeamSlugResult {
  const params = useParams<{ teamId: string }>();
  const [result, setResult] = useState<UseTeamSlugResult>({
    teamId: null,
    teamSlug: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const resolveTeam = async () => {
      if (!params.teamId) {
        setResult({
          teamId: null,
          teamSlug: null,
          isLoading: false,
          error: 'No team identifier provided'
        });
        return;
      }

      try {
        setResult(prev => ({ ...prev, isLoading: true, error: null }));

        // Resolve the team identifier to get the actual UUID
        const resolvedTeamId = await TeamResolver.resolveTeamId(params.teamId);
        
        if (!resolvedTeamId) {
          setResult({
            teamId: null,
            teamSlug: null,
            isLoading: false,
            error: 'Team not found'
          });
          return;
        }

        // Get the slug for this team (might be the same as params.teamId if it's already a slug)
        const slug = await TeamResolver.getTeamSlugOrId(resolvedTeamId);

        setResult({
          teamId: resolvedTeamId,
          teamSlug: slug,
          isLoading: false,
          error: null
        });

        logger.debug('Team slug resolved successfully', {
          identifier: params.teamId,
          teamId: resolvedTeamId,
          slug
        });

      } catch (error) {
        logger.error('Error resolving team slug', { identifier: params.teamId, error });
        
        setResult({
          teamId: null,
          teamSlug: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    resolveTeam();
  }, [params.teamId]);

  return result;
}

/**
 * Hook for generating team-based URLs with slugs
 */
export function useTeamUrls(teamSlug?: string) {
  const { teamSlug: currentSlug } = useTeamSlug();
  const slug = teamSlug || currentSlug;

  const generateUrl = (path: string) => {
    if (!slug) return '#';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/dashboard/${slug}/${cleanPath}`;
  };

  return {
    overview: () => generateUrl(''),
    candidates: () => generateUrl('candidates'),
    candidateUpload: () => generateUrl('candidates/upload'),
    candidateDetail: (candidateId: string) => generateUrl(`candidates/${candidateId}`),
    documents: () => generateUrl('documents'),
    documentUpload: () => generateUrl('documents/upload'),
    assistant: () => generateUrl('assistant'),
    settings: () => generateUrl('settings'),
    generateUrl
  };
}
