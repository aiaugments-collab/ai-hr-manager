import { Candidate } from '@/lib/types/candidate';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreDisplay } from './score-display';
import { Calendar, Mail, Phone, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface CandidateCardProps {
  candidate: Candidate;
  onStatusUpdate?: (candidateId: string, status: Candidate['status']) => void;
}

export function CandidateCard({ candidate, onStatusUpdate }: CandidateCardProps) {
  const params = useParams<{ teamId: string }>();
  
  // Quick status update handler
  const handleQuickStatusUpdate = (e: React.MouseEvent, status: Candidate['status']) => {
    e.preventDefault(); // Prevent navigation to detail page
    e.stopPropagation();
    if (onStatusUpdate) {
      onStatusUpdate(candidate.id, status);
    }
  };
  
  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'new':
        return 'bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-700 border-blue-200 shadow-sm';
      case 'reviewed':
        return 'bg-gradient-to-r from-yellow-50 to-orange-100 text-yellow-700 border-yellow-200 shadow-sm';
      case 'shortlisted':
        return 'bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 border-green-200 shadow-sm';
      case 'rejected':
        return 'bg-gradient-to-r from-red-50 to-pink-100 text-red-700 border-red-200 shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border-gray-200 shadow-sm';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 transform">
      <Link href={`/dashboard/${params.teamId}/candidates/${candidate.id}`} className="block h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Avatar className="h-12 w-12 flex-shrink-0 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg leading-tight truncate text-slate-800 dark:text-slate-100">{candidate.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">{candidate.position}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <ScoreDisplay score={candidate.score} size="sm" />
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(candidate.status)}`}
              >
                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{candidate.phone}</span>
              </div>
            )}
          </div>

          {/* Experience and Application Date */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{candidate.experience} years experience</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Applied {formatDate(candidate.uploadedAt)}</span>
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Key Skills:</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-sm">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 4 && (
                <Badge className="text-xs px-2 py-1 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 shadow-sm">
                  +{candidate.skills.length - 4} more
                </Badge>
              )}
            </div>
          </div>

                           {/* Quick Actions & Footer */}
                 <div className="pt-3 border-t border-border/50 space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <FileText className="h-4 w-4 flex-shrink-0" />
                       <span>CV Available</span>
                     </div>
                     <Badge variant="outline" className="text-xs font-medium">
                       {candidate.aiAnalysis.experienceLevel}
                     </Badge>
                   </div>
                   
                   {/* Quick Action Buttons */}
                   {onStatusUpdate && candidate.status !== 'shortlisted' && candidate.status !== 'rejected' && (
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs py-1 h-7 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 rounded-lg"
                         onClick={(e) => handleQuickStatusUpdate(e, 'shortlisted')}
                       >
                         ✓ Shortlist
                       </Button>
                       <Button
                         size="sm"
                         className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs py-1 h-7 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 rounded-lg"
                         onClick={(e) => handleQuickStatusUpdate(e, 'rejected')}
                       >
                         ✗ Reject
                       </Button>
                     </div>
                   )}
                 </div>
        </CardContent>
      </Link>
    </Card>
  );
}
