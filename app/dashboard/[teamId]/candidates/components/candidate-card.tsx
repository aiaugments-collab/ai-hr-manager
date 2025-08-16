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
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-border/50 hover:border-border">
      <Link href={`/dashboard/${params.teamId}/candidates/${candidate.id}`} className="block h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg leading-tight truncate">{candidate.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{candidate.position}</p>
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
            <p className="text-sm font-medium text-muted-foreground">Key Skills:</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs px-2 py-1">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 4 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
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
                         className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-7"
                         onClick={(e) => handleQuickStatusUpdate(e, 'shortlisted')}
                       >
                         ✓ Shortlist
                       </Button>
                       <Button
                         size="sm"
                         variant="destructive"
                         className="flex-1 text-xs py-1 h-7"
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
