'use client';

import { useState, useEffect } from 'react';
import { CandidateList } from './components/candidate-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CandidateService } from '@/lib/services/candidate-service';
import { Candidate, CandidateFilters, CandidateStats } from '@/lib/types/candidate';
import { Upload, Users, Star, FileText, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createLogger } from '@/lib/utils/logger';

export default function CandidatesPage() {
  const params = useParams<{ teamId: string }>();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<CandidateStats>({
    total: 0,
    new: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0,
    averageScore: 0,
    highScoreCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidateFilters>({
    search: '',
    minScore: 0,
    maxScore: 100,
    status: 'all',
    experienceLevel: 'all',
    skills: []
  });

  // Fetch candidates on component mount
  useEffect(() => {
    const fetchCandidates = async () => {
      const logger = createLogger('CandidatesPage');
      
      try {
        setLoading(true);
        setError(null);
        
        logger.info('Fetching candidates for team', { teamId: params.teamId });
        
        const fetchedCandidates = await CandidateService.getCandidates(params.teamId);
        const calculatedStats = CandidateService.calculateStats(fetchedCandidates);
        
        setCandidates(fetchedCandidates);
        setStats(calculatedStats);
        
        logger.info('Candidates loaded successfully', { 
          count: fetchedCandidates.length,
          stats: calculatedStats 
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load candidates';
        setError(errorMessage);
        logger.error('Failed to fetch candidates', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.teamId) {
      fetchCandidates();
    }
  }, [params.teamId]);

  // Handle candidate status updates
  const handleStatusUpdate = async (candidateId: string, newStatus: Candidate['status']) => {
    const logger = createLogger('CandidatesPage');
    
    try {
      logger.info('Updating candidate status', { candidateId, newStatus });
      
      await CandidateService.updateCandidateStatus(candidateId, newStatus);
      
      // Update local state
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, status: newStatus }
          : candidate
      ));
      
      // Recalculate stats
      const updatedCandidates = candidates.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, status: newStatus }
          : candidate
      );
      setStats(CandidateService.calculateStats(updatedCandidates));
      
      logger.info('Candidate status updated successfully', { candidateId, newStatus });
      
    } catch (err) {
      logger.error('Failed to update candidate status', err);
      // You might want to show a toast notification here
    }
  };

  // Filter candidates
  const filteredCandidates = CandidateService.filterCandidates(candidates, filters);

  // Show loading state
  if (loading) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
              <p className="text-muted-foreground">
                Manage and review candidate applications with AI-powered analysis
              </p>
            </div>
            <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload CVs
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">Loading candidates...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
              <p className="text-muted-foreground">
                Manage and review candidate applications with AI-powered analysis
              </p>
            </div>
            <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload CVs
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Candidates</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
            <p className="text-muted-foreground">
              Manage and review candidate applications with AI-powered analysis
            </p>
          </div>
          <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload CVs
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All applications received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shortlisted}</div>
              <p className="text-xs text-muted-foreground">
                Top candidates selected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Scores</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highScoreCount}</div>
              <p className="text-xs text-muted-foreground">
                Score 80+ candidates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}</div>
              <p className="text-xs text-muted-foreground">
                Overall candidate quality
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Candidates List */}
        <Card>
          <CardHeader>
            <CardTitle>All Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Candidates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload some CVs to get started with AI-powered candidate analysis
                </p>
                <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First CV
                  </Button>
                </Link>
              </div>
            ) : (
              <CandidateList
                candidates={filteredCandidates}
                filters={filters}
                onFiltersChange={setFilters}
                onStatusUpdate={handleStatusUpdate}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
