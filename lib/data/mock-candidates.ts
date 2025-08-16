import { Candidate, CandidateStats } from '@/lib/types/candidate';

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    position: 'Senior Software Engineer',
    experience: 6,
    score: 92,
    status: 'shortlisted',
    uploadedAt: new Date('2025-01-15'),
    cvUrl: '/cvs/sarah-johnson.pdf',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
    education: [
      {
        degree: 'Master of Science',
        institution: 'Stanford University',
        year: 2019,
        field: 'Computer Science'
      },
      {
        degree: 'Bachelor of Science',
        institution: 'UC Berkeley',
        year: 2017,
        field: 'Computer Engineering'
      }
    ],
    workExperience: [
      {
        company: 'Google',
        position: 'Senior Software Engineer',
        startDate: '2021-03',
        endDate: 'Present',
        description: 'Led development of cloud infrastructure tools, managed team of 5 engineers',
        duration: '3 years 10 months'
      },
      {
        company: 'Microsoft',
        position: 'Software Engineer II',
        startDate: '2019-06',
        endDate: '2021-02',
        description: 'Developed Azure services and APIs, improved system performance by 40%',
        duration: '1 year 8 months'
      }
    ],
    summary: 'Experienced software engineer with expertise in full-stack development and cloud technologies.',
    aiAnalysis: {
      skillsMatch: 95,
      experienceLevel: 'Senior',
      strengths: ['Strong technical leadership', 'Cloud architecture expertise', 'Full-stack development'],
      weaknesses: ['Limited mobile development experience'],
      recommendation: 'Excellent candidate with strong technical background and leadership experience.',
      keyHighlights: ['6+ years experience', 'Led teams at major tech companies', 'Cloud expertise']
    }
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 987-6543',
    position: 'Product Manager',
    experience: 4,
    score: 88,
    status: 'reviewed',
    uploadedAt: new Date('2025-01-14'),
    cvUrl: '/cvs/michael-chen.pdf',
    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research', 'SQL', 'Figma'],
    education: [
      {
        degree: 'MBA',
        institution: 'Wharton School',
        year: 2021,
        field: 'Business Administration'
      },
      {
        degree: 'Bachelor of Science',
        institution: 'MIT',
        year: 2019,
        field: 'Computer Science'
      }
    ],
    workExperience: [
      {
        company: 'Meta',
        position: 'Senior Product Manager',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Managed product roadmap for messaging platform, increased user engagement by 25%',
        duration: '3 years'
      },
      {
        company: 'Uber',
        position: 'Product Manager',
        startDate: '2021-06',
        endDate: '2021-12',
        description: 'Led product initiatives for driver experience, launched 3 major features',
        duration: '6 months'
      }
    ],
    summary: 'Strategic product manager with strong technical background and proven track record.',
    aiAnalysis: {
      skillsMatch: 90,
      experienceLevel: 'Mid-level',
      strengths: ['Strong analytical skills', 'Technical product expertise', 'User-focused approach'],
      weaknesses: ['Limited B2B product experience'],
      recommendation: 'Strong candidate with excellent product sense and technical understanding.',
      keyHighlights: ['MBA from top school', 'Product experience at major tech companies', 'Data-driven approach']
    }
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 456-7890',
    position: 'UX Designer',
    experience: 3,
    score: 75,
    status: 'new',
    uploadedAt: new Date('2025-01-16'),
    cvUrl: '/cvs/emily-rodriguez.pdf',
    skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'HTML/CSS'],
    education: [
      {
        degree: 'Bachelor of Fine Arts',
        institution: 'Art Center College of Design',
        year: 2022,
        field: 'Interaction Design'
      }
    ],
    workExperience: [
      {
        company: 'Airbnb',
        position: 'UX Designer',
        startDate: '2022-08',
        endDate: 'Present',
        description: 'Designed user experiences for host onboarding, improved conversion by 15%',
        duration: '2 years 5 months'
      },
      {
        company: 'Startup Inc',
        position: 'Junior UX Designer',
        startDate: '2022-01',
        endDate: '2022-07',
        description: 'Created wireframes and prototypes for mobile app, conducted user interviews',
        duration: '7 months'
      }
    ],
    summary: 'Creative UX designer with focus on user-centered design and data-driven decisions.',
    aiAnalysis: {
      skillsMatch: 85,
      experienceLevel: 'Mid-level',
      strengths: ['Strong design portfolio', 'User research skills', 'Cross-functional collaboration'],
      weaknesses: ['Limited enterprise product experience', 'Newer to the field'],
      recommendation: 'Promising designer with good foundation, would benefit from mentorship.',
      keyHighlights: ['Strong portfolio', 'Experience at well-known companies', 'User research background']
    }
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1 (555) 321-0987',
    position: 'Data Scientist',
    experience: 5,
    score: 71,
    status: 'reviewed',
    uploadedAt: new Date('2025-01-13'),
    cvUrl: '/cvs/david-kim.pdf',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics', 'R'],
    education: [
      {
        degree: 'PhD',
        institution: 'Carnegie Mellon University',
        year: 2020,
        field: 'Machine Learning'
      },
      {
        degree: 'Master of Science',
        institution: 'University of Washington',
        year: 2017,
        field: 'Statistics'
      }
    ],
    workExperience: [
      {
        company: 'Netflix',
        position: 'Senior Data Scientist',
        startDate: '2020-09',
        endDate: 'Present',
        description: 'Built recommendation algorithms, improved user engagement metrics',
        duration: '4 years 4 months'
      }
    ],
    summary: 'PhD-level data scientist with expertise in machine learning and statistical modeling.',
    aiAnalysis: {
      skillsMatch: 80,
      experienceLevel: 'Senior',
      strengths: ['Strong academic background', 'Deep ML expertise', 'Research experience'],
      weaknesses: ['Limited business context experience', 'Narrow industry exposure'],
      recommendation: 'Strong technical candidate but may need support with business applications.',
      keyHighlights: ['PhD in ML', 'Experience at major streaming company', 'Research background']
    }
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@email.com',
    phone: '+1 (555) 654-3210',
    position: 'Marketing Manager',
    experience: 2,
    score: 58,
    status: 'rejected',
    uploadedAt: new Date('2025-01-12'),
    cvUrl: '/cvs/lisa-thompson.pdf',
    skills: ['Digital Marketing', 'Social Media', 'Content Creation', 'Google Analytics', 'SEO'],
    education: [
      {
        degree: 'Bachelor of Arts',
        institution: 'UCLA',
        year: 2023,
        field: 'Marketing'
      }
    ],
    workExperience: [
      {
        company: 'Local Agency',
        position: 'Marketing Coordinator',
        startDate: '2023-06',
        endDate: 'Present',
        description: 'Managed social media campaigns, created content for various clients',
        duration: '1 year 7 months'
      }
    ],
    summary: 'Entry-level marketing professional with focus on digital marketing and social media.',
    aiAnalysis: {
      skillsMatch: 60,
      experienceLevel: 'Junior',
      strengths: ['Enthusiastic learner', 'Social media expertise', 'Creative thinking'],
      weaknesses: ['Limited experience', 'Lacks strategic marketing background', 'No B2B experience'],
      recommendation: 'Entry-level candidate, may not meet current requirements but shows potential.',
      keyHighlights: ['Recent graduate', 'Digital marketing focus', 'Creative background']
    }
  }
];

export const mockCandidateStats: CandidateStats = {
  total: 127,
  new: 23,
  reviewed: 45,
  shortlisted: 31,
  rejected: 28,
  averageScore: 74,
  highScoreCount: 23
};
