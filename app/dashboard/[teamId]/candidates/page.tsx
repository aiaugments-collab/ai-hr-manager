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
import { logger } from '@/lib/utils/logger';

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
    role: 'all',
    skills: []
  });

  // Fetch candidates on component mount
  useEffect(() => {
    const fetchCandidates = async () => {
      // Using logger with context 'CandidatesPage'
      
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
    // Using logger with context 'CandidatesPage'
    
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
      <div className="flex-col min-h-screen">
        <div className="flex-1 space-y-6 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Candidates</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage and review candidate applications with AI-powered analysis
              </p>
            </div>
            <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
              <Button className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-10 px-4 gap-2">
                <Upload className="h-4 w-4" />
                Upload CVs
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Loading candidates...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-col min-h-screen">
        <div className="flex-1 space-y-6 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Candidates</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage and review candidate applications with AI-powered analysis
              </p>
            </div>
            <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
              <Button className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-10 px-4 gap-2">
                <Upload className="h-4 w-4" />
                Upload CVs
              </Button>
            </Link>
          </div>
          
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Failed to Load Candidates</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl px-6"
                >
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
    <div className="flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Candidates</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage and review candidate applications with AI-powered analysis
            </p>
          </div>
          <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
            <Button className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-10 px-4 gap-2">
              <Upload className="h-4 w-4" />
              Upload CVs
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Candidates</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                All applications received
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">New Applications</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.new}</div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Shortlisted</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.shortlisted}</div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Top candidates selected
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-800/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">High Scores</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.highScoreCount}</div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Score 80+ candidates
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200/50 dark:border-slate-800/50 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Average Score</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.averageScore}</div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Overall candidate quality
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Candidates List */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">All Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Candidates Yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  Upload some CVs to get started with AI-powered candidate analysis
                </p>
                <Link href={`/dashboard/${params.teamId}/candidates/upload`}>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl px-6 py-3">
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
