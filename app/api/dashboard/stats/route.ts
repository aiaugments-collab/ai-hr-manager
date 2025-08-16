import { NextRequest, NextResponse } from 'next/server';
import { CandidateService } from '@/lib/services/candidate-service';
import { DocumentService } from '@/lib/services/document-service';
import { ApiTeamResolver } from '@/lib/utils/api-team-resolver';
import { logger } from '@/lib/utils/logger';

export interface DashboardStats {
  candidates: {
    total: number;
    new: number;
    reviewed: number;
    shortlisted: number;
    rejected: number;
    averageScore: number;
    highScoreCount: number;
    recentUploads: number; // Last 7 days
  };
  documents: {
    total: number;
    recentUploads: number; // Last 7 days
    totalSize: number;
    byType: {
      pdf: number;
      doc: number;
      docx: number;
      txt: number;
    };
  };
  aiActivity: {
    totalConversations: number; // Placeholder for now
    questionsAnswered: number; // Placeholder for now
  };
  trends: {
    candidatesPerMonth: Array<{
      month: string;
      total: number;
      averageScore: number;
    }>;
    documentsPerMonth: Array<{
      month: string;
      total: number;
    }>;
  };
}

export async function GET(request: NextRequest) {
  const apiTimer = logger.time('Dashboard Stats API Request', 'DashboardStatsAPI');
  
  try {
    logger.info('Dashboard stats API request received', {}, 'DashboardStatsAPI');
    
    const teamId = await ApiTeamResolver.getResolvedTeamId(request);
    
    if (!teamId) {
      logger.warn('No team ID provided in dashboard stats request', {}, 'DashboardStatsAPI');
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    logger.info('Fetching dashboard stats', { teamId }, 'DashboardStatsAPI');
    
    // Get candidates and documents in parallel
    const [candidates, documents] = await Promise.all([
      CandidateService.getCandidates(teamId),
      DocumentService.getDocuments(teamId)
    ]);
    
    logger.info('Data fetched for dashboard stats', { 
      candidateCount: candidates.length,
      documentCount: documents.length,
      teamId 
    }, 'DashboardStatsAPI');
    
    // Calculate candidate stats
    const candidateStats = CandidateService.calculateStats(candidates);
    
    // Calculate recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCandidates = candidates.filter(c => 
      new Date(c.uploadedAt) >= sevenDaysAgo
    ).length;
    
    const recentDocuments = documents.filter(d => 
      new Date(d.uploadedAt) >= sevenDaysAgo
    ).length;
    
    // Calculate document stats
    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalDocumentSize = documents.reduce((total, doc) => total + doc.size, 0);
    
    // Generate trends data (last 6 months)
    const candidateTrends = generateCandidateTrends(candidates);
    const documentTrends = generateDocumentTrends(documents);
    
    const stats: DashboardStats = {
      candidates: {
        ...candidateStats,
        recentUploads: recentCandidates
      },
      documents: {
        total: documents.length,
        recentUploads: recentDocuments,
        totalSize: totalDocumentSize,
        byType: {
          pdf: documentsByType.pdf || 0,
          doc: documentsByType.doc || 0,
          docx: documentsByType.docx || 0,
          txt: documentsByType.txt || 0
        }
      },
      aiActivity: {
        totalConversations: Math.floor(Math.random() * 100) + 50, // TODO: Add real chat tracking
        questionsAnswered: Math.floor(Math.random() * 200) + 100 // TODO: Add real chat tracking
      },
      trends: {
        candidatesPerMonth: candidateTrends,
        documentsPerMonth: documentTrends
      }
    };
    
    logger.info('Dashboard stats calculated successfully', { 
      teamId,
      candidateTotal: stats.candidates.total,
      documentTotal: stats.documents.total 
    }, 'DashboardStatsAPI');
    
    apiTimer();
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    apiTimer();
    
    logger.error('Dashboard stats API error', error, 'DashboardStatsAPI');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function generateCandidateTrends(candidates: any[]): Array<{month: string, total: number, averageScore: number}> {
  const trends: Array<{month: string, total: number, averageScore: number}> = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Generate last 6 months of data
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    
    // Filter candidates for this month
    const monthCandidates = candidates.filter(candidate => {
      const candidateDate = new Date(candidate.uploadedAt);
      return candidateDate.getMonth() === monthIndex && 
             candidateDate.getFullYear() === new Date().getFullYear();
    });
    
    const averageScore = monthCandidates.length > 0 
      ? Math.round(monthCandidates.reduce((sum, c) => sum + c.score, 0) / monthCandidates.length)
      : 0;
    
    trends.push({
      month: monthName,
      total: monthCandidates.length,
      averageScore
    });
  }
  
  return trends;
}

function generateDocumentTrends(documents: any[]): Array<{month: string, total: number}> {
  const trends: Array<{month: string, total: number}> = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Generate last 6 months of data
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    
    // Filter documents for this month
    const monthDocuments = documents.filter(document => {
      const documentDate = new Date(document.uploadedAt);
      return documentDate.getMonth() === monthIndex && 
             documentDate.getFullYear() === new Date().getFullYear();
    });
    
    trends.push({
      month: monthName,
      total: monthDocuments.length
    });
  }
  
  return trends;
}
