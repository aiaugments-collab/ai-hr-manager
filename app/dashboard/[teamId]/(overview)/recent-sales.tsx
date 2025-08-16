import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

interface Candidate {
  id: string;
  name: string;
  position: string;
  score: number;
  uploadedAt: Date | string;
}

interface RecentCandidatesProps {
  candidates: Candidate[];
}

export function RecentCandidates({ candidates }: RecentCandidatesProps) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="text-center">
          <p>No candidates yet</p>
          <p className="text-sm">Upload CVs to see recent candidates</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return uploadDate.toLocaleDateString();
  };

  // Show top 5 recent candidates
  const recentCandidates = candidates.slice(0, 5);

  return (
    <div className="space-y-6">
      {recentCandidates.map((candidate) => (
        <div key={candidate.id} className="flex items-center group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1 flex-1">
            <p className="text-sm font-medium leading-none">{candidate.name}</p>
            <p className="text-sm text-muted-foreground">
              {candidate.position}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(candidate.uploadedAt)}
            </p>
          </div>
          <div className={`ml-auto font-medium ${getScoreColor(candidate.score)}`}>
            {candidate.score}/100
          </div>
        </div>
      ))}
    </div>
  );
}
