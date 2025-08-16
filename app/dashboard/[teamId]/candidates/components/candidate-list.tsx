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

  const handleRoleFilter = (role: string) => {
    onFiltersChange({ 
      ...filters, 
      role: role as CandidateFilters['role']
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

      // Role filter
      if (filters.role !== 'all' && !candidate.position.toLowerCase().includes(filters.role.toLowerCase())) {
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
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search candidates by name, email, position, or skills..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-11 h-11 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm"
          />
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-11 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filters.status !== 'all' || filters.experienceLevel !== 'all' || filters.role !== 'all') && (
              <Badge className="ml-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm">
                Active
              </Badge>
            )}
          </Button>
          
          <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px] h-11 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl hover:shadow-md transition-all duration-200">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-xl">
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
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-6 space-y-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-semibold mb-3 block text-slate-700 dark:text-slate-300">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.status === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('all')}
                  className={filters.status === 'all' 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg rounded-lg" 
                    : "bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg hover:shadow-md transition-all duration-200"
                  }
                >
                  All ({candidates.length})
                </Button>
                <Button
                  variant={filters.status === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('new')}
                  className={filters.status === 'new' 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg rounded-lg" 
                    : "bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg hover:shadow-md transition-all duration-200"
                  }
                >
                  New ({getStatusCount('new')})
                </Button>
                <Button
                  variant={filters.status === 'reviewed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('reviewed')}
                  className={filters.status === 'reviewed' 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg rounded-lg" 
                    : "bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg hover:shadow-md transition-all duration-200"
                  }
                >
                  Reviewed ({getStatusCount('reviewed')})
                </Button>
                <Button
                  variant={filters.status === 'shortlisted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('shortlisted')}
                  className={filters.status === 'shortlisted' 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg rounded-lg" 
                    : "bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg hover:shadow-md transition-all duration-200"
                  }
                >
                  Shortlisted ({getStatusCount('shortlisted')})
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-3 block text-slate-700 dark:text-slate-300">Experience Level</label>
              <Select value={filters.experienceLevel} onValueChange={handleExperienceFilter}>
                <SelectTrigger className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg hover:shadow-md transition-all duration-200">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-xl">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid-level">Mid-level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-3 block text-slate-700 dark:text-slate-300">Role</label>
              <Select value={filters.role} onValueChange={handleRoleFilter}>
                <SelectTrigger className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg hover:shadow-md transition-all duration-200">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-xl">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="software engineer">Software Engineer</SelectItem>
                  <SelectItem value="frontend developer">Frontend Developer</SelectItem>
                  <SelectItem value="backend developer">Backend Developer</SelectItem>
                  <SelectItem value="full stack">Full Stack Developer</SelectItem>
                  <SelectItem value="data scientist">Data Scientist</SelectItem>
                  <SelectItem value="product manager">Product Manager</SelectItem>
                  <SelectItem value="project manager">Project Manager</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="ui/ux">UI/UX Designer</SelectItem>
                  <SelectItem value="devops">DevOps Engineer</SelectItem>
                  <SelectItem value="qa">QA Engineer</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-3 block text-slate-700 dark:text-slate-300">Score Range</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
                  className="w-20 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg"
                  placeholder="Min"
                />
                <span className="text-slate-500 dark:text-slate-400 font-medium">to</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxScore}
                  onChange={(e) => onFiltersChange({ ...filters, maxScore: Number(e.target.value) })}
                  className="w-20 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-lg"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          Showing {filteredAndSortedCandidates.length} of {candidates.length} candidates
        </p>
      </div>

      {/* Candidates Grid */}
      {filteredAndSortedCandidates.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-16 w-16 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Search className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No candidates found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">No candidates match your current search criteria.</p>
          <Button
            onClick={() => onFiltersChange({
              search: '',
              minScore: 0,
              maxScore: 100,
              status: 'all',
              experienceLevel: 'all',
              role: 'all',
              skills: []
            })}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl px-6"
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
