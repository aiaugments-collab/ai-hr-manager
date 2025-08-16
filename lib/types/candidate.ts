export interface Candidate {
  id: string;
  teamId: string;
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  experience: number; // years of experience
  score: number; // AI score 0-100
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected';
  uploadedAt: Date;
  cvUrl: string;
  skills: string[];
  education: Education[];
  workExperience: WorkExperience[];
  summary: string;
  aiAnalysis: AIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
  field?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string | 'Present';
  description: string;
  duration: string; // e.g., "2 years 3 months"
}

export interface AIAnalysis {
  skillsMatch: number; // percentage match with job requirements
  experienceLevel: 'Junior' | 'Mid-level' | 'Senior' | 'Expert';
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  keyHighlights: string[];
}

export interface CandidateFilters {
  search: string;
  minScore: number;
  maxScore: number;
  status: Candidate['status'] | 'all';
  experienceLevel: AIAnalysis['experienceLevel'] | 'all';  
  role: string | 'all'; // for position-based filtering (software engineer, manager, etc.)
  skills: string[];
}

export interface CandidateStats {
  total: number;
  new: number;
  reviewed: number;
  shortlisted: number;
  rejected: number;
  averageScore: number;
  highScoreCount: number; // score >= 80
}
