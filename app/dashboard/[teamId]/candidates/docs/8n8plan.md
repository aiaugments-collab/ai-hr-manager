I'll help you create a plan to integrate n8n for your candidate workflow. Let me first understand your current project structure and then provide a comprehensive plan in plain English.
Ran tool
Ran tool
Ran tool
Ran tool
Ran tool
Now I have a good understanding of your current AI HR Manager project. Let me provide you with a comprehensive plan to integrate n8n for the candidate workflow automation.

## Plan: n8n Integration for Candidate Email Workflow

### Overview
We'll create an automated pipeline where an admin configures a single email account per team, n8n monitors for new candidate emails, processes them through Gemini AI, and saves structured data to Firebase.

### Architecture Components

1. **Email Monitoring & Trigger**
   - n8n will monitor ONE admin-configured email per team
   - Trigger based on specific subject lines, sender domains, or email content patterns
   - Support for Gmail, Outlook, or custom SMTP (starting with one email provider)

2. **Email Processing Pipeline**
   - Extract CV attachments (PDF files) from candidate emails
   - Parse email content for additional candidate information
   - Validate file formats and sizes before processing

3. **AI Analysis Integration**
   - Send extracted CVs to your existing Gemini service
   - Use your current candidate analysis structure
   - Maintain the same scoring and data extraction logic

4. **Firebase Data Storage**
   - Store processed candidates using your existing candidate service
   - Link candidates to the team based on the configured admin email
   - Maintain all your current data structure and relationships

### Detailed Implementation Plan

#### Phase 1: n8n Setup & Configuration
1. **n8n Installation Options**
   - Self-hosted n8n instance (recommended for data privacy)
   - n8n Cloud (easier setup but requires data sharing considerations)
   - Docker deployment for development/testing

2. **Admin Email Configuration**
   - Admin configures ONE email account per team
   - Set up OAuth2 authentication for the chosen provider (Gmail/Outlook)
   - Secure credential storage in n8n for the admin-configured email

3. **Webhook Endpoints**
   - Create n8n webhook endpoints for communication with your Next.js app
   - Secure these endpoints with authentication tokens
   - Set up error handling and retry mechanisms

#### Phase 2: Email Monitoring Workflow
1. **Email Trigger Node**
   - Monitor the single admin-configured email account
   - Filter emails based on configurable criteria:
     - Subject line keywords (e.g., "CV", "Resume", "Application")
     - Sender domain patterns
     - Attachment presence and types
     - Specific folders (e.g., "Jobs", "Applications")

2. **Email Processing Logic**
   - Extract email metadata (sender, subject, date, recipient)
   - Parse email body for additional candidate information
   - Download and validate PDF attachments
   - Handle multiple attachments and email formats

3. **Team Association**
   - All candidates from the admin email automatically associate with the team
   - Simple one-to-one mapping: admin email → team ID
   - Store team ID in n8n workflow configuration

#### Phase 3: CV Processing Integration
1. **File Validation**
   - Check file types and sizes before processing
   - Validate PDF integrity and readability
   - Handle encrypted or password-protected files

2. **Gemini API Integration**
   - Create n8n HTTP nodes to call your existing Gemini endpoints
   - Use your current `/api/candidates/upload` structure
   - Maintain error handling and retry logic for API failures

3. **Data Processing**
   - Transform email data into your candidate structure
   - Merge email information with AI-extracted data
   - Generate unique candidate IDs using your UUID package

#### Phase 4: Firebase Integration
1. **Database Storage**
   - Use your existing Firebase configuration
   - Call your candidate service methods through API endpoints
   - Maintain data consistency and validation rules

2. **File Storage**
   - Store CV files using your current storage system
   - Generate proper file URLs and references
   - Handle file naming conflicts and organization

3. **Notification System**
   - Send notifications when new candidates are processed
   - Email team members about successful/failed processing
   - Create dashboard alerts for processing status

#### Phase 5: Error Handling & Monitoring
1. **Comprehensive Error Handling**
   - API failure recovery and retry mechanisms
   - Invalid file format handling
   - Network connectivity issues
   - Authentication token expiration handling

2. **Logging & Monitoring**
   - Detailed processing logs in n8n
   - Integration with your existing logger system
   - Performance monitoring and metrics collection

3. **Failed Processing Recovery**
   - Queue system for failed email processing
   - Manual retry mechanisms for team administrators
   - Backup storage for unprocessed emails

#### Phase 6: Configuration & Management
1. **Admin Email Management**
   - Simple admin interface to configure the team email
   - Email credential testing and validation
   - One email per team management

2. **Processing Rules Configuration**
   - Basic email filtering rules (subject keywords, attachment types)
   - Simple trigger configuration for job applications
   - Standard candidate scoring criteria (using existing Gemini logic)

3. **Dashboard Integration**
   - Real-time processing status display
   - Email processing statistics and metrics
   - Failed processing alerts and resolution tools

### Technical Considerations

#### Security & Privacy
- Secure admin email credential storage with encryption
- OAuth2 token management and refresh handling for the single email
- Data privacy compliance for email content processing
- Admin-only access control for email configuration

#### Performance & Scalability
- Rate limiting for email provider APIs
- Batch processing for multiple candidates from the same email
- Queue management for high-volume email processing
- Simple team ID mapping (no complex caching needed)

#### Integration Points
- Webhook security with API key authentication
- Database transaction handling for consistency
- File upload progress tracking and status updates
- Real-time notifications for processing completion

### Next Steps for Implementation

1. **Choose n8n deployment method** (self-hosted vs cloud)
2. **Set up development environment** with n8n instance
3. **Create basic email monitoring workflow** for ONE admin email
4. **Implement webhook endpoints** in your Next.js app
5. **Test with sample candidate emails** and CV attachments
6. **Build simple admin email configuration interface**
7. **Deploy and configure production environment**

### Simplified Workflow Summary

**Admin Setup:**
- Admin goes to team settings
- Configures ONE email account for the team (Gmail/Outlook)
- Sets basic filtering rules (optional)

**Automated Processing:**
- n8n monitors the admin email 24/7
- When new candidate email arrives with CV attachment:
  1. Extract PDF attachment
  2. Send to your existing Gemini API
  3. Process and structure candidate data
  4. Save to Firebase with team ID
  5. Notify team of new candidate

**Benefits:**
- Simple one-email-per-team setup
- No complex user management
- Uses your existing AI processing
- Maintains your current data structure
- Easy to start with and scale later

This simplified approach gets you automated candidate processing without complex multi-user email management.