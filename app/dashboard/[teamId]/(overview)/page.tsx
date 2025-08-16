"use client";

import { useEffect, useState } from "react";
import { Metadata } from "next";
import { useParams } from "next/navigation";
import { useTeamSlug, useTeamUrls } from "@/lib/hooks/use-team-slug";
import { RecentCandidates } from "@/app/dashboard/[teamId]/(overview)/recent-sales";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Graph } from "./graph";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DashboardStats {
  candidates: {
    total: number;
    new: number;
    reviewed: number;
    shortlisted: number;
    rejected: number;
    averageScore: number;
    highScoreCount: number;
    recentUploads: number;
  };
  documents: {
    total: number;
    recentUploads: number;
    totalSize: number;
    byType: {
      pdf: number;
      doc: number;
      docx: number;
      txt: number;
    };
  };
  aiActivity: {
    totalConversations: number;
    questionsAnswered: number;
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

interface Candidate {
  id: string;
  name: string;
  position: string;
  score: number;
  uploadedAt: Date | string;
}

export default function DashboardPage() {
  const { teamId, teamSlug, isLoading: teamLoading, error: teamError } = useTeamSlug();
  const urls = useTeamUrls();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard stats
        const statsResponse = await fetch(`/api/dashboard/stats?teamId=${teamSlug || teamId}`);
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const statsData = await statsResponse.json();
        setStats(statsData.stats);

        // Fetch recent candidates for the sidebar
        const candidatesResponse = await fetch(`/api/candidates?teamId=${teamSlug || teamId}`);
        if (!candidatesResponse.ok) {
          throw new Error('Failed to fetch candidates');
        }
        const candidatesData = await candidatesResponse.json();
        setRecentCandidates(candidatesData.candidates || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (teamId && !teamLoading) {
      fetchDashboardData();
    }
  }, [teamId, teamSlug, teamLoading]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (teamLoading || loading) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">HR Dashboard</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (teamError || error) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">HR Dashboard</h2>
          </div>
          <Alert>
            <AlertDescription>
              Failed to load dashboard data: {teamError || error}. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">HR Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and analyze your team&apos;s performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Data
            </Badge>
            <div className="hidden md:flex items-center space-x-3">
              <a 
                href={urls.candidateUpload()}
                className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-10 px-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                Upload CV
              </a>
              <a 
                href={urls.documentUpload()}
                className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 backdrop-blur-sm h-10 px-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                Add Document
              </a>
            </div>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Total Candidates
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-5 w-5 text-white"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.candidates.total}</div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                +{stats.candidates.recentUploads} new this week
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                High Score Candidates
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-5 w-5 text-white"
                >
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.candidates.highScoreCount}</div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Score 80+ candidates (Avg: {stats.candidates.averageScore})
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Documents</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-5 w-5 text-white"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.documents.total}</div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                {formatFileSize(stats.documents.totalSize)} total size
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-800/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                AI Conversations
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-5 w-5 text-white"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.aiActivity.questionsAnswered}</div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Questions answered
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts and Activity */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Candidate Analytics</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Monthly candidate trends and scoring patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Graph data={stats.trends.candidatesPerMonth} type="candidates" />
            </CardContent>
          </Card>
          
          <Card className="col-span-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Recent Candidates</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Latest candidates analyzed ({recentCandidates.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentCandidates candidates={recentCandidates} />
            </CardContent>
          </Card>
        </div>
        
        {/* Status Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">New Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.candidates.new}</div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Pending review</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200/50 dark:border-yellow-800/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Reviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.candidates.reviewed}</div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Under consideration</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-800/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Shortlisted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.candidates.shortlisted}</div>
              <p className="text-sm text-green-600 dark:text-green-400">Ready for interview</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200/50 dark:border-slate-800/50 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Document Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">PDF:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.documents.byType.pdf}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">DOCX:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.documents.byType.docx}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">TXT:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.documents.byType.txt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
