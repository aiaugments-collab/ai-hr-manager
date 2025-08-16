/**
 * Custom Parser for AI-generated structured data
 * Handles custom delimiter format without JSON syntax issues
 */

export interface ParsedCandidate {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  experience?: number;
  score?: number;
  summary?: string;
  skills?: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
    field?: string;
  }>;
  workExperience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    duration: string;
    description: string;
  }>;
  aiAnalysis?: {
    skillsMatch: number;
    experienceLevel: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    keyHighlights: string[];
  };
}

export class CustomParser {
  private static readonly START_DELIMITER = '===CANDIDATE_DATA_START===';
  private static readonly END_DELIMITER = '===CANDIDATE_DATA_END===';

  /**
   * Parse custom delimited format to structured data
   */
  static parseDelimitedData(text: string): ParsedCandidate | null {
    try {
      const startIndex = text.indexOf(this.START_DELIMITER);
      const endIndex = text.indexOf(this.END_DELIMITER);
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Delimiters not found in response');
      }
      
      const dataString = text
        .substring(startIndex + this.START_DELIMITER.length, endIndex)
        .trim();
      
      return this.parseCustomFormat(dataString);
    } catch (error) {
      throw new Error(`Custom format parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse the custom key-value format into structured data
   */
  private static parseCustomFormat(data: string): ParsedCandidate {
    const result: ParsedCandidate = {};
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentSection = '';
    let sectionData: string[] = [];
    
    for (const line of lines) {
      // Handle section markers
      if (line.endsWith('_START:')) {
        currentSection = line.replace('_START:', '');
        sectionData = [];
        continue;
      }
      
      if (line.endsWith('_END:')) {
        // Process collected section data
        this.processSectionData(result, currentSection, sectionData);
        currentSection = '';
        sectionData = [];
        continue;
      }
      
      // Handle regular key-value pairs
      if (line.includes(':') && !currentSection) {
        this.parseKeyValuePair(result, line);
      } else if (currentSection) {
        // Collect section data
        sectionData.push(line);
      }
    }
    
    return result;
  }

  /**
   * Parse individual key-value pairs
   */
  private static parseKeyValuePair(result: ParsedCandidate, line: string): void {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    
    switch (key.trim()) {
      case 'NAME':
        result.name = value;
        break;
      case 'EMAIL':
        result.email = value === 'NONE' ? '' : value;
        break;
      case 'PHONE':
        result.phone = value === 'NONE' ? undefined : value;
        break;
      case 'POSITION':
        result.position = value;
        break;
      case 'EXPERIENCE_YEARS':
        result.experience = this.parseNumber(value, 0);
        break;
      case 'SCORE':
        result.score = this.parseNumber(value, 0, 0, 100);
        break;
      case 'SUMMARY':
        result.summary = value;
        break;
    }
  }

  /**
   * Process section data (skills, education, work, analysis)
   */
  private static processSectionData(result: ParsedCandidate, section: string, data: string[]): void {
    switch (section) {
      case 'SKILLS':
        result.skills = data.filter(skill => skill.length > 0);
        break;
        
      case 'EDUCATION':
        result.education = this.parseEducationSection(data);
        break;
        
      case 'WORK':
        result.workExperience = this.parseWorkSection(data);
        break;
        
      case 'ANALYSIS':
        result.aiAnalysis = this.parseAnalysisSection(data);
        break;
    }
  }

  /**
   * Parse education section
   */
  private static parseEducationSection(data: string[]): ParsedCandidate['education'] {
    return data.map(line => {
      const parts = line.split('|').map(p => p.trim());
      const edu: any = {
        degree: '',
        institution: '',
        year: new Date().getFullYear(),
        field: undefined
      };
      
      parts.forEach(part => {
        if (part.startsWith('DEGREE:')) {
          edu.degree = part.replace('DEGREE:', '').trim();
        }
        if (part.startsWith('INSTITUTION:')) {
          edu.institution = part.replace('INSTITUTION:', '').trim();
        }
        if (part.startsWith('YEAR:')) {
          edu.year = this.parseNumber(part.replace('YEAR:', '').trim(), new Date().getFullYear());
        }
        if (part.startsWith('FIELD:')) {
          const field = part.replace('FIELD:', '').trim();
          edu.field = field === 'NONE' ? undefined : field;
        }
      });
      
      return edu;
    }).filter(edu => edu.degree || edu.institution);
  }

  /**
   * Parse work experience section
   */
  private static parseWorkSection(data: string[]): ParsedCandidate['workExperience'] {
    return data.map(line => {
      const parts = line.split('|').map(p => p.trim());
      const work: any = {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        duration: '',
        description: ''
      };
      
      parts.forEach(part => {
        if (part.startsWith('COMPANY:')) {
          work.company = part.replace('COMPANY:', '').trim();
        }
        if (part.startsWith('POSITION:')) {
          work.position = part.replace('POSITION:', '').trim();
        }
        if (part.startsWith('START:')) {
          work.startDate = part.replace('START:', '').trim();
        }
        if (part.startsWith('END:')) {
          work.endDate = part.replace('END:', '').trim();
        }
        if (part.startsWith('DURATION:')) {
          work.duration = part.replace('DURATION:', '').trim();
        }
        if (part.startsWith('DESC:')) {
          work.description = part.replace('DESC:', '').trim();
        }
      });
      
      return work;
    }).filter(work => work.company || work.position);
  }

  /**
   * Parse analysis section
   */
  private static parseAnalysisSection(data: string[]): ParsedCandidate['aiAnalysis'] {
    const analysis: any = {
      skillsMatch: 0,
      experienceLevel: 'Mid-level',
      strengths: [],
      weaknesses: [],
      recommendation: '',
      keyHighlights: []
    };
    
    data.forEach(line => {
      if (line.startsWith('SKILLS_MATCH:')) {
        analysis.skillsMatch = this.parseNumber(line.replace('SKILLS_MATCH:', '').trim(), 0, 0, 100);
      }
      if (line.startsWith('EXPERIENCE_LEVEL:')) {
        const level = line.replace('EXPERIENCE_LEVEL:', '').trim();
        analysis.experienceLevel = ['Junior', 'Mid-level', 'Senior', 'Expert'].includes(level) ? level : 'Mid-level';
      }
      if (line.startsWith('STRENGTHS:')) {
        analysis.strengths = this.parsePipeDelimitedList(line.replace('STRENGTHS:', '').trim());
      }
      if (line.startsWith('WEAKNESSES:')) {
        analysis.weaknesses = this.parsePipeDelimitedList(line.replace('WEAKNESSES:', '').trim());
      }
      if (line.startsWith('RECOMMENDATION:')) {
        analysis.recommendation = line.replace('RECOMMENDATION:', '').trim();
      }
      if (line.startsWith('HIGHLIGHTS:')) {
        analysis.keyHighlights = this.parsePipeDelimitedList(line.replace('HIGHLIGHTS:', '').trim());
      }
    });
    
    return analysis;
  }

  /**
   * Parse pipe-delimited list
   */
  private static parsePipeDelimitedList(value: string): string[] {
    return value.split('|').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Parse number with bounds checking
   */
  private static parseNumber(value: string, defaultValue: number, min?: number, max?: number): number {
    const parsed = parseInt(value) || defaultValue;
    
    if (min !== undefined && parsed < min) return min;
    if (max !== undefined && parsed > max) return max;
    
    return parsed;
  }

  /**
   * Validate parsed data completeness
   */
  static validateParsedData(data: ParsedCandidate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (!data.email || data.email.trim().length === 0) {
      errors.push('Email is required');
    }
    
    if (!data.position || data.position.trim().length === 0) {
      errors.push('Position is required');
    }
    
    if (data.score === undefined || data.score < 0 || data.score > 100) {
      errors.push('Score must be between 0 and 100');
    }
    
    if (!data.skills || data.skills.length === 0) {
      errors.push('At least one skill is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
