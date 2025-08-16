# Candidate Management Feature Implementation Plan

## Overview
This plan outlines the complete workflow for implementing the candidate management system, supporting both manual CV upload and automated email processing.

## Workflow Options

### Option A: Manual Upload (Original Plan)
1. HR uploads multiple CV files (PDF format)
2. System processes each CV with Gemini AI
3. AI extracts structured candidate data
4. Data is saved to Firebase
5. HR reviews candidates and updates their status

### Option B: Automated Email Processing (NEW! 🚀)
1. n8n monitors HR Gmail inbox for job applications
2. Automatically detects emails with CV attachments
3. Sends PDF to AI analysis API
4. Creates candidate records automatically
5. Notifies HR of new processed candidates
6. HR reviews and manages candidates in dashboard

---

## Current Implementation Phases (Option A)

## Phase 1: File Upload & PDF Processing System

### 1.1 Create CV Upload Page
- **File**: `app/dashboard/[teamId]/candidates/upload/page.tsx`
- **Features**:
  - Drag & drop interface for multiple PDF files
  - File validation (PDF only, max size limits)
  - Upload progress indicators
  - Preview of selected files before upload
  - Real-time PDF parsing feedback

### 1.2 PDF Processing Setup
- **PDF to Markdown Conversion**:
  - Use `pdf-parse` library to extract text from PDFs
  - Convert extracted text to clean markdown format
  - Preserve formatting (headers, lists, sections)
  - Handle multi-page documents properly

### 1.3 Upload & Processing API Endpoint
- **File**: `app/api/candidates/upload/route.ts`
- **Functionality**:
  - Accept multiple PDF files (client-side only)
  - Parse each PDF to extract text content
  - Convert text to structured markdown
  - Store markdown content in Firestore
  - Return parsed content and metadata
  - Handle parsing errors gracefully

### 1.4 Database Schema for PDF Content
```typescript
interface CandidateDocument {
  id: string;
  teamId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  markdownContent: string; // Parsed PDF content as markdown
  processingStatus: 'pending' | 'completed' | 'failed';
  processingError?: string;
}
```

---

## Phase 2: AI Processing with Gemini

### 2.1 Gemini Integration Setup
- **File**: `lib/services/gemini-service.ts`
- **Configuration**:
  - Set up Gemini API client
  - Configure API key and settings
  - Create prompt templates for CV analysis

### 2.2 CV Text Extraction
- **Options**:
  - Use PDF parsing library (pdf-parse or similar)
  - Or send PDF directly to Gemini Vision API
- **Process**:
  - Extract text content from PDF
  - Clean and format text for AI processing

### 2.3 AI Analysis Prompt Design
```json
{
  "prompt": "Analyze this CV and extract structured information. Return JSON with:",
  "required_fields": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "position": "string (inferred job title)",
    "experience": "number (years)",
    "skills": "array of strings",
    "education": "array of objects",
    "workExperience": "array of objects",
    "summary": "string (brief summary)",
    "aiAnalysis": {
      "skillsMatch": "number (0-100)",
      "experienceLevel": "Junior|Mid-level|Senior|Expert",
      "strengths": "array of strings",
      "weaknesses": "array of strings", 
      "recommendation": "string",
      "keyHighlights": "array of strings"
    }
  }
}
```

### 2.4 AI Processing API
- **File**: `app/api/candidates/analyze/route.ts`
- **Process**:
  1. Receive CV file URL
  2. Extract text from PDF
  3. Send to Gemini with structured prompt
  4. Parse and validate AI response
  5. Calculate overall score (0-100)
  6. Return structured candidate data

---

## Phase 3: Firebase Database Integration

### 3.1 Firestore Schema Design
```typescript
// Collection: candidates
{
  id: string,
  teamId: string,
  name: string,
  email: string,
  phone?: string,
  position: string,
  experience: number,
  score: number,
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected',
  uploadedAt: Timestamp,
  cvUrl: string,
  skills: string[],
  education: Education[],
  workExperience: WorkExperience[],
  summary: string,
  aiAnalysis: AIAnalysis,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3.2 Database Service
- **File**: `lib/services/candidate-service.ts`
- **Functions**:
  - `createCandidate(data: Candidate): Promise<string>`
  - `getCandidates(teamId: string): Promise<Candidate[]>`
  - `updateCandidateStatus(id: string, status: string): Promise<void>`
  - `getCandidateById(id: string): Promise<Candidate>`
  - `deleteCanddidate(id: string): Promise<void>`

### 3.3 Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /candidates/{candidateId} {
      allow read, write: if request.auth != null 
        && resource.data.teamId in request.auth.token.teams;
    }
  }
}
```

---

## Phase 4: Complete Upload Workflow

### 4.1 Orchestration Service
- **File**: `lib/services/upload-orchestrator.ts`
- **Process**:
  1. Upload CV files to Firebase Storage
  2. For each file:
     - Process with Gemini AI
     - Create candidate record in Firestore
     - Update upload progress
  3. Handle errors and retries
  4. Return summary of processed candidates

### 4.2 Upload Progress Tracking
- **Real-time Updates**:
  - Use Firebase Realtime Database or Firestore
  - Track processing status for each file
  - Show progress to HR user
  - Handle partial failures

### 4.3 Error Handling
- **Scenarios**:
  - File upload failures
  - AI processing errors
  - Database save failures
  - Invalid CV formats
- **Recovery**:
  - Retry mechanisms
  - Partial success handling
  - User-friendly error messages

---

## Phase 5: HR Review Interface

### 5.1 Enhanced Candidate List
- **Current Status**: ✅ Already implemented
- **Enhancements Needed**:
  - Real-time updates from Firebase
  - Bulk status updates
  - Advanced filtering options

### 5.2 Candidate Detail Page
- **File**: `app/dashboard/[teamId]/candidates/[candidateId]/page.tsx`
- **Features**:
  - Full candidate profile view
  - CV viewer/download
  - AI analysis details
  - Status update controls
  - Notes/comments section

### 5.3 Status Management
- **Actions**:
  - Mark as Reviewed
  - Shortlist candidate
  - Reject candidate
  - Add notes/feedback
- **API**: `app/api/candidates/[id]/status/route.ts`

---

## Phase 6: Integration & Testing

### 6.1 End-to-End Workflow
1. **Upload Flow**:
   - Upload multiple CVs → Process with AI → Save to database → Show results
2. **Review Flow**:
   - View candidates → Review details → Update status → Track changes

### 6.2 Error Scenarios Testing
- Invalid file formats
- Large file uploads
- AI processing failures
- Network interruptions
- Database connection issues

### 6.3 Performance Optimization
- Batch processing for multiple files
- Caching of AI responses
- Optimized database queries
- Image/file compression

---

## Implementation Order

### Week 1: Foundation
1. ✅ Data models and types (DONE)
2. ✅ UI components (DONE)
3. Firebase setup and configuration
4. Basic file upload functionality

### Week 2: AI Integration
1. Gemini API integration
2. PDF text extraction
3. AI analysis pipeline
4. Structured data parsing

### Week 3: Database & Workflow
1. Firestore integration
2. Complete upload orchestration
3. Real-time updates
4. Error handling

### Week 4: Polish & Testing
1. Candidate detail page
2. Status management
3. End-to-end testing
4. Performance optimization

---

## Technical Dependencies

### Required Packages
```json
{
  "firebase": "^10.x",
  "firebase-admin": "^12.x",
  "@google/generative-ai": "^0.x",
  "pdf-parse": "^1.x",
  "uuid": "^9.x"
}
```

### Environment Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
GEMINI_API_KEY=
```

---

## Success Metrics

1. **Upload Success Rate**: >95% of valid PDFs processed successfully
2. **AI Accuracy**: Manual review shows >80% accuracy in extracted data
3. **Processing Time**: <30 seconds per CV on average
4. **User Experience**: HR can process 20+ candidates in <10 minutes
5. **Error Recovery**: All failures have clear error messages and recovery options

---

## Next Steps

1. Set up Firebase project and configuration
2. Install required dependencies
3. Create upload page UI
4. Implement basic file upload to Firebase Storage
5. Set up Gemini API integration
6. Build AI processing pipeline

This plan provides a comprehensive roadmap for implementing the complete candidate management workflow from upload to review.

---

## Future Phase: Automated Email Processing (Option B)

### Phase 7: n8n Email Automation Setup

#### 7.1 n8n Workflow Configuration
- **Prerequisites**: Phases 1-6 must be completed and working
- **Setup Requirements**:
  - n8n instance (cloud or self-hosted)
  - Gmail API access for HR inbox
  - Webhook endpoint for our AI processing API

#### 7.2 Email Monitoring Workflow
```
Gmail Trigger → Email Filter → PDF Extraction → AI Processing → Database Save → HR Notification
```

**Workflow Nodes:**
1. **Gmail Trigger Node**
   - Monitor specific HR email inbox
   - Trigger on new emails with attachments
   - Filter by sender domains or subject keywords

2. **Email Processing Node**
   - Extract PDF attachments from emails
   - Parse email metadata (sender, subject, date)
   - Validate attachment is a CV/resume

3. **HTTP Request Node**
   - Send PDF to existing AI analysis API
   - Include email context (sender info, subject)
   - Handle API response and errors

4. **Firebase Node**
   - Save processed candidate to database
   - Include email source information
   - Set status as 'new' for HR review

5. **Notification Node**
   - Send Slack/email notification to HR
   - Include candidate summary and score
   - Provide link to review in dashboard

#### 7.3 Enhanced Email Intelligence
- **Smart Email Detection**:
  - Identify job application emails vs other correspondence
  - Extract job position from email subject/body
  - Detect follow-up emails from same candidate
  - Handle multiple CVs in single email

- **Auto-Response System**:
  - Send confirmation receipt to candidates
  - Provide application tracking information
  - Set expectations for response timeline

#### 7.4 Advanced Automation Features
- **High-Score Auto-Actions**:
  - Auto-schedule phone screens for 90+ scores
  - Send interview invitation emails
  - Create calendar events for HR team

- **Low-Score Handling**:
  - Auto-send polite rejection emails for <50 scores
  - Add to talent pool for future opportunities
  - Generate rejection reason summaries

#### 7.5 Integration with Existing System
- **API Enhancements Needed**:
  - Add email source tracking to candidate model
  - Create webhook endpoint for n8n integration
  - Add bulk processing capabilities

- **Database Schema Updates**:
```typescript
interface Candidate {
  // ... existing fields
  source: 'manual_upload' | 'email_automation';
  emailMetadata?: {
    fromEmail: string;
    subject: string;
    receivedAt: Date;
    originalEmailId: string;
  };
  autoProcessed: boolean;
}
```

#### 7.6 Monitoring and Analytics
- **Email Processing Metrics**:
  - Success rate of email-to-candidate conversion
  - Average processing time per email
  - False positive rate (non-CV emails processed)
  - HR satisfaction with auto-processed candidates

- **Dashboard Enhancements**:
  - Filter candidates by source (manual vs email)
  - Show email processing statistics
  - Display email automation health status

### Phase 8: Advanced Email Automation

#### 8.1 Multi-Inbox Support
- Support multiple HR email addresses
- Team-specific email routing
- Department-based candidate categorization

#### 8.2 Integration with Job Boards
- Monitor emails from LinkedIn, Indeed, etc.
- Parse job board application formats
- Extract additional metadata from job platforms

#### 8.3 Candidate Communication Automation
- Automated interview scheduling
- Follow-up email sequences
- Rejection and acceptance letter automation
- Reference check request automation

---

## Implementation Priority

### Phase 1-6: Core System (Weeks 1-4)
**Priority**: HIGH - Must be completed first
- Manual upload and AI processing
- Database integration and HR review interface
- Essential for basic functionality

### Phase 7: Email Automation (Week 5-6)
**Priority**: MEDIUM - Significant productivity boost
- Requires core system to be stable
- Major workflow improvement for HR teams
- Can be implemented incrementally

### Phase 8: Advanced Features (Week 7+)
**Priority**: LOW - Nice-to-have enhancements
- Advanced automation features
- Multi-platform integrations
- Can be added based on user feedback

---

## Benefits of Email Automation (Option B)

### For HR Teams:
- **Zero Manual Upload**: Candidates automatically processed from emails
- **24/7 Processing**: CVs analyzed immediately when received
- **Consistent Screening**: Every candidate gets same AI analysis
- **Faster Response**: Automated confirmations and quick turnaround

### For Candidates:
- **Instant Confirmation**: Immediate receipt acknowledgment
- **Faster Processing**: No waiting for HR to manually upload
- **Consistent Experience**: Standardized application process

### For Business:
- **Scalability**: Handle 100+ applications per day automatically
- **Cost Efficiency**: Reduce manual HR processing time by 80%
- **Competitive Advantage**: Faster response times than competitors
- **Data Insights**: Complete application funnel analytics

This email automation system would transform the candidate management process from reactive to proactive, making it a true AI-powered HR solution.
