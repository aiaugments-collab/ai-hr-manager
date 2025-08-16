'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CandidateService } from '@/lib/services/candidate-service';
import { Candidate } from '@/lib/types/candidate';
import { createLogger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScoreDisplay } from '../components/score-display';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  GraduationCap,
  Briefcase,
  Star,
  TrendingUp,
  AlertCircle,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';

// Helper function to get initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Helper function to format duration
function formatDuration(startDate: string, endDate: string): string {
  if (endDate === 'Present') {
    const start = new Date(startDate + '-01');
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  }
  
  const start = new Date(startDate + '-01');
  const end = new Date(endDate + '-01');
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }
}

export default function CandidateDetailPage() {
  const params = useParams<{ teamId: string; candidateId: string }>();
  const router = useRouter();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Fetch candidate details
  useEffect(() => {
    const fetchCandidate = async () => {
      const logger = createLogger('CandidateDetailPage');
      
      try {
        setLoading(true);
        setError(null);
        
        logger.info('Fetching candidate details', { candidateId: params.candidateId });
        
        const fetchedCandidate = await CandidateService.getCandidateById(params.candidateId);
        
        if (!fetchedCandidate) {
          setError('Candidate not found');
          return;
        }
        
        // Verify candidate belongs to the current team
        if (fetchedCandidate.teamId !== params.teamId) {
          setError('Candidate not found in this team');
          return;
        }
        
        setCandidate(fetchedCandidate);
        
        logger.info('Candidate details loaded successfully', { 
          candidateId: params.candidateId,
          candidateName: fetchedCandidate.name 
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load candidate details';
        setError(errorMessage);
        
        const logger = createLogger('CandidateDetailPage');
        logger.error('Failed to fetch candidate details', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.candidateId && params.teamId) {
      fetchCandidate();
    }
  }, [params.candidateId, params.teamId]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: Candidate['status']) => {
    if (!candidate || updating) return;
    
    const logger = createLogger('CandidateDetailPage');
    
    try {
      setUpdating(true);
      setUpdateSuccess(null);
      
      logger.info('Updating candidate status', { candidateId: candidate.id, newStatus });
      
      await CandidateService.updateCandidateStatus(candidate.id, newStatus);
      
      // Update local state
      setCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Show success message
      setUpdateSuccess(`Status updated to ${newStatus}`);
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      logger.info('Candidate status updated successfully', { candidateId: candidate.id, newStatus });
      
    } catch (err) {
      logger.error('Failed to update candidate status', err);
      setError('Failed to update status. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  // Get status color
  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shortlisted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${params.teamId}/candidates`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Candidates
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">Loading candidate details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !candidate) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${params.teamId}/candidates`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Candidates
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Candidate Not Found</h3>
                <p className="text-muted-foreground mb-4">{error || 'The candidate you are looking for does not exist.'}</p>
                <Link href={`/dashboard/${params.teamId}/candidates`}>
                  <Button>
                    Back to Candidates
                  </Button>
                </Link>
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
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${params.teamId}/candidates`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Candidates
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Candidate Details</h2>
              <p className="text-muted-foreground">
                View and manage candidate information
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Action Buttons */}
            <Button 
              onClick={() => handleStatusUpdate('shortlisted')}
              disabled={updating || candidate?.status === 'shortlisted'}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {updating && candidate?.status !== 'shortlisted' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              Shortlist
            </Button>
            <Button 
              onClick={() => handleStatusUpdate('rejected')}
              disabled={updating || candidate?.status === 'rejected'}
              variant="destructive"
              size="sm"
            >
              {updating && candidate?.status !== 'rejected' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
            <Button 
              onClick={() => handleStatusUpdate('reviewed')}
              disabled={updating || candidate?.status === 'reviewed'}
              variant="outline" 
              size="sm"
            >
              {updating && candidate?.status !== 'reviewed' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Mark Reviewed
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {updateSuccess && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-2 py-3">
              <div className="h-2 w-2 bg-green-600 rounded-full"></div>
              <span className="text-green-800 text-sm font-medium">{updateSuccess}</span>
            </CardContent>
          </Card>
        )}
        
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 py-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800 text-sm font-medium">{error}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {getInitials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-2xl font-bold">{candidate.name}</h3>
                      <p className="text-lg text-muted-foreground">{candidate.position}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{candidate.email}</span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ScoreDisplay score={candidate.score} size="lg" />
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(candidate.status)}`}
                    >
                      {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.experience} years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Applied {formatDate(candidate.uploadedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>CV Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.aiAnalysis.experienceLevel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Professional Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {candidate.summary}
                </p>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.workExperience.map((work, index) => (
                    <div key={index} className="border-l-2 border-muted pl-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{work.position}</h4>
                          <p className="text-muted-foreground">{work.company}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{work.startDate} - {work.endDate}</p>
                          <p>{formatDuration(work.startDate, work.endDate)}</p>
                        </div>
                      </div>
                      {work.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {work.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-muted-foreground">{edu.institution}</p>
                        {edu.field && (
                          <p className="text-sm text-muted-foreground">{edu.field}</p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {edu.year}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Analysis & Actions */}
          <div className="space-y-6">
            {/* Status Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(candidate.status)} text-lg px-4 py-2`}
                    >
                      {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Quick Actions:</p>
                    {(['new', 'reviewed', 'shortlisted', 'rejected'] as const).map((status) => {
                      const isCurrentStatus = candidate.status === status;
                      const isUpdating = updating;
                      
                      let buttonVariant: "default" | "outline" | "destructive" = "outline";
                      let buttonClass = "";
                      
                      if (status === 'shortlisted') {
                        buttonVariant = isCurrentStatus ? "default" : "outline";
                        buttonClass = isCurrentStatus ? "" : "hover:bg-green-50 hover:text-green-700 hover:border-green-300";
                      } else if (status === 'rejected') {
                        buttonVariant = isCurrentStatus ? "destructive" : "outline";
                        buttonClass = isCurrentStatus ? "" : "hover:bg-red-50 hover:text-red-700 hover:border-red-300";
                      } else {
                        buttonVariant = isCurrentStatus ? "default" : "outline";
                      }
                      
                      return (
                        <Button
                          key={status}
                          variant={buttonVariant}
                          size="sm"
                          className={`w-full justify-start ${buttonClass}`}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={isCurrentStatus || isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <>
                              {status === 'shortlisted' && <Star className="h-4 w-4 mr-2" />}
                              {status === 'rejected' && <AlertCircle className="h-4 w-4 mr-2" />}
                              {status === 'reviewed' && <Edit className="h-4 w-4 mr-2" />}
                              {status === 'new' && <User className="h-4 w-4 mr-2" />}
                            </>
                          )}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                          {isCurrentStatus && <span className="ml-auto text-xs">Current</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Skills Match</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${candidate.aiAnalysis.skillsMatch}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{candidate.aiAnalysis.skillsMatch}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Strengths</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {candidate.aiAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Areas for Improvement</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {candidate.aiAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Key Highlights</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {candidate.aiAnalysis.keyHighlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">AI Recommendation</h4>
                  <p className="text-sm text-muted-foreground">
                    {candidate.aiAnalysis.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
