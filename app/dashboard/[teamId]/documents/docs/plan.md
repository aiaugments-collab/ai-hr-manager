# Document Management (Knowledge Base) Implementation Plan

## Overview
Simple document storage system where HR can upload company documents and the AI assistant can search through them. No fancy features - just upload, store, list, and search.

## What We're Building
- Upload page for company documents (PDF, DOC, TXT)
- List page showing all uploaded documents
- Simple search through document content
- Delete documents functionality
- Text extraction from files for AI to use

---

## Phase 1: Basic File Upload (1-2 hours)

### 1.1 Create Documents Page Structure
- **File**: `app/dashboard/[teamId]/documents/page.tsx`
- **Features**:
  - Simple list of uploaded documents
  - Upload button that goes to upload page
  - Delete button for each document

### 1.2 Create Upload Page
- **File**: `app/dashboard/[teamId]/documents/upload/page.tsx`
- **Features**:
  - Drag & drop for multiple files
  - Support PDF, DOC, DOCX, TXT files
  - File validation and size limits
  - Upload progress indicator

### 1.3 Upload API Endpoint
- **File**: `app/api/documents/upload/route.ts`
- **Process**:
  1. Accept file uploads
  2. Save files to Firebase Storage
  3. Extract text content from files
  4. Save document metadata to Firestore
  5. Return success/error response

---

## Phase 2: Document Storage & Management (1 hour)

### 2.1 Document Data Model
```typescript
// lib/types/document.ts
interface Document {
  id: string;
  teamId: string;
  name: string;
  type: string; // 'pdf' | 'doc' | 'docx' | 'txt'
  size: number;
  uploadedAt: Date;
  fileUrl: string;
  textContent: string; // extracted text for AI
  createdBy: string;
}
```

### 2.2 Document Service
- **File**: `lib/services/document-service.ts`
- **Functions**:
  - `uploadDocument(file, teamId): Promise<Document>`
  - `getDocuments(teamId): Promise<Document[]>`
  - `deleteDocument(id): Promise<void>`
  - `searchDocuments(teamId, query): Promise<Document[]>`

### 2.3 Text Extraction
- Use simple libraries for text extraction:
  - PDF: `pdf-parse`
  - DOC/DOCX: `mammoth` 
  - TXT: direct read
- Store extracted text in Firestore for AI to search

---

## Phase 3: Document List & Management UI (1 hour)

### 3.1 Document List Component
- **File**: `app/dashboard/[teamId]/documents/components/document-list.tsx`
- **Features**:
  - Show document name, type, size, upload date
  - Delete button for each document
  - Simple search box to filter documents
  - Download/view document links

### 3.2 Document Upload Component
- **File**: `app/dashboard/[teamId]/documents/components/document-upload.tsx`
- **Features**:
  - Drag & drop area
  - File selection button
  - Upload progress bars
  - Error handling display

---

## Phase 4: Search Functionality (30 minutes)

### 4.1 Search API
- **File**: `app/api/documents/search/route.ts`
- **Process**:
  1. Take search query
  2. Search through document text content
  3. Return matching documents with highlights
  4. Simple text matching (no fancy algorithms)

### 4.2 Search Integration
- Add search box to documents page
- Show search results with document snippets
- Click to view full document

---

## Implementation Order (Total: ~4-5 hours)

### Step 1: Setup (30 min)
1. Create folder structure
2. Add document types
3. Install text extraction packages

### Step 2: Upload System (2 hours)
1. Create upload page UI
2. Build upload API endpoint
3. Add text extraction logic
4. Test file uploads

### Step 3: Document Management (1.5 hours)
1. Create documents list page
2. Add document service functions
3. Build delete functionality
4. Test CRUD operations

### Step 4: Search & Polish (1 hour)
1. Add search API endpoint
2. Integrate search in UI
3. Add error handling
4. Final testing

---

## Required Packages
```json
{
  "pdf-parse": "^1.x",
  "mammoth": "^1.x"
}
```

## Database Schema (Firestore)
```
Collection: documents
{
  id: string,
  teamId: string,
  name: string,
  type: string,
  size: number,
  uploadedAt: timestamp,
  fileUrl: string,
  textContent: string,
  createdBy: string
}
```

---

## Success Criteria
1. ✅ HR can upload PDF, DOC, TXT files
2. ✅ Files are stored securely in Firebase
3. ✅ Text content is extracted and stored
4. ✅ HR can view list of all documents
5. ✅ HR can delete documents
6. ✅ Basic search through document content works
7. ✅ AI assistant can access document text (for Phase 3)

---

## What We're NOT Building (Keep it simple!)
- ❌ Document categories/folders
- ❌ Document versioning
- ❌ Advanced search with filters
- ❌ Document preview/viewer
- ❌ User permissions per document
- ❌ Document sharing
- ❌ OCR for scanned documents

This plan focuses on the absolute essentials to get document storage working for the AI assistant. We can add fancy features later if needed.
