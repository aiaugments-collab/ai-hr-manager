import { Candidate, CandidateFilters } from '@/lib/types/candidate';
import { CandidateCard } from './candidate-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { useState } from 'react';

interface CandidateListProps {
  candidates: Candidate[];
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
  onStatusUpdate?: (candidateId: string, status: Candidate['status']) => void;
}

type SortOption = 'score-desc' | 'score-asc' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

export function CandidateList({ candidates, filters, onFiltersChange, onStatusUpdate }: CandidateListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('score-desc');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusFilter = (status: Candidate['status'] | 'all') => {
    onFiltersChange({ ...filters, status });
  };

  const handleExperienceFilter = (experienceLevel: string) => {
    onFiltersChange({ 
      ...filters, 
      experienceLevel: experienceLevel as CandidateFilters['experienceLevel']
    });
  };

  const sortCandidates = (candidates: Candidate[], sortBy: SortOption) => {
    return [...candidates].sort((a, b) => {
      switch (sortBy) {
        case 'score-desc':
          return b.score - a.score;
        case 'score-asc':
          return a.score - b.score;
        case 'date-desc':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'date-asc':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  };

  const filterCandidates = (candidates: Candidate[]) => {
    return candidates.filter(candidate => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower) ||
          candidate.position.toLowerCase().includes(searchLower) ||
          candidate.skills.some(skill => skill.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && candidate.status !== filters.status) {
        return false;
      }

      // Experience level filter
      if (filters.experienceLevel !== 'all' && candidate.aiAnalysis.experienceLevel !== filters.experienceLevel) {
        return false;
      }

      // Score range filter
      if (candidate.score < filters.minScore || candidate.score > filters.maxScore) {
        return false;
      }

      return true;
    });
  };

  const filteredAndSortedCandidates = sortCandidates(filterCandidates(candidates), sortBy);

  const getStatusCount = (status: Candidate['status']) => {
    return candidates.filter(c => c.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search candidates by name, email, position, or skills..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filters.status !== 'all' || filters.experienceLevel !== 'all') && (
              <Badge variant="secondary" className="ml-1">
                Active
              </Badge>
            )}
          </Button>
          
          <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  Score (High to Low)
                </div>
              </SelectItem>
              <SelectItem value="score-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Score (Low to High)
                </div>
              </SelectItem>
              <SelectItem value="date-desc">Latest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.status === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('all')}
                >
                  All ({candidates.length})
                </Button>
                <Button
                  variant={filters.status === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('new')}
                >
                  New ({getStatusCount('new')})
                </Button>
                <Button
                  variant={filters.status === 'reviewed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('reviewed')}
                >
                  Reviewed ({getStatusCount('reviewed')})
                </Button>
                <Button
                  variant={filters.status === 'shortlisted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('shortlisted')}
                >
                  Shortlisted ({getStatusCount('shortlisted')})
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Experience Level</label>
              <Select value={filters.experienceLevel} onValueChange={handleExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid-level">Mid-level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Score Range</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
                  className="w-20"
                  placeholder="Min"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxScore}
                  onChange={(e) => onFiltersChange({ ...filters, maxScore: Number(e.target.value) })}
                  className="w-20"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedCandidates.length} of {candidates.length} candidates
        </p>
      </div>

      {/* Candidates Grid */}
      {filteredAndSortedCandidates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No candidates found matching your criteria.</p>
          <Button
            variant="outline"
            onClick={() => onFiltersChange({
              search: '',
              minScore: 0,
              maxScore: 100,
              status: 'all',
              experienceLevel: 'all',
              skills: []
            })}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedCandidates.map((candidate) => (
            <CandidateCard 
              key={candidate.id} 
              candidate={candidate} 
              onStatusUpdate={onStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
