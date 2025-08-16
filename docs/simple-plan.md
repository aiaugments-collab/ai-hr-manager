### **B. HR Knowledge Base**

* **Upload docs (PDF, DOCX, TXT)**

  * Use `pdf-parse` or `docx-parser` in Next.js API routes.
  * Chunk into 1k-token pieces.
  * Generate embeddings with Gemini → store vectors in Supabase Vector table.
* **Q\&A Flow**

  * Employee question → embed → search vector DB → retrieve top 3 chunks → feed to Gemini chat with context → return structured answer.

---

### **C. Candidate Screening**

* **Resume Upload (drag-and-drop)**

  * Parse PDF → extract text → create embeddings.
* **Job Description Matching**

  * HR posts job description → embed it.
  * Compare candidate embeddings with job embedding (cosine similarity).
  * Use Gemini to generate a summary: *“Strong in X, weak in Y, overall 8/10 fit.”*
* **Output:**

  ```json
  {
    "score": 0.82,
    "summary": "Strong technical background, lacks leadership experience",
    "recommendation": "Good fit for senior engineer, not lead role."
  }
  ```

---

### **D. AI HR Assistant (Chat)**

* **System Prompt Example:**

```text
You are an HR assistant for {{company_name}}. 
Use only the company's uploaded documents to answer. 
If unsure, say: "I'm not certain — please contact HR."
Be professional, concise, and friendly.
```

* **Server Action Flow:**

  1. Query → create embedding → retrieve docs →
  2. Send {docs + question} to Gemini →
  3. Return AI answer → store in `queries` table (for HR to audit).

---

## **3. Implementation Details**

### **Frontend (Next.js 14)**

* **Admin Dashboard Pages**:

  * `/dashboard` → see usage metrics, recent queries, top questions
  * `/documents` → upload/view HR docs
  * `/candidates` → upload resumes, see scores
  * `/settings` → company profile
* **Employee Portal Page**:

  * `/assistant` → ask questions, see answers (chat-style)
* **Component Libraries:**

  * **Tailwind + shadcn/ui** → fast styling
  * **React Query** → fetch server actions
  * **UploadThing** or **Next S3 upload** → file uploads

---

