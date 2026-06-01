# 🌌 EduPulse AI: Next-Gen AI Study Workspace

> **Transform static study materials into interactive learning hubs.** Upload PDFs, interrogate documents in real-time, generate custom interactive practice quizzes, and master complex academic topics with an AI study workspace engineered for speed, utility, and premium user experience.

---

## 🌟 Introduction & Project Vision

**EduPulse AI** is a state-of-the-art AI-powered academic learning workspace built on Next.js 15, Vercel AI SDK v4, and the Gemini 2.5 Flash model. 

Traditional study methods involve passive reading. **EduPulse AI** makes learning dynamic. By parsing uploaded documents, the application instantiates a persistent conversational bridge and compiles multi-concept quizzes on command. Built with modern web best practices—such as dynamic stream-scrolling, high-performance in-memory caching, secure relational storage, and robust resilience frameworks—EduPulse AI bridges the gap between passive reading and active retrieval practice.

---

## ⚡ Core Feature Spotlight

### 💬 1. Context-Aware AI Chat & Document Interrogation
* **In-Context Learning:** Ask questions directly about your uploaded study documents or syllabus. The AI references **only** your document's text, serving as a highly targeted, hallucination-free tutor.
* **Real-time Streaming:** Seamless and immediate response streaming using the Vercel AI SDK, with a custom micro-animated auto-scroll handler that ensures readable alignment during high-frequency token generation.
* **Graceful Degradation:** Production-ready error boundaries capturing Gemini quota exceptions (`429`), authentication errors (`401`/`503`), and provider network time-outs, displaying contextual warning messages directly to users rather than crashing the UI.

### 📝 2. Dynamic Interactive MCQ Practice Library
* **Custom Quiz Generation:** Select your target depth by generating multiple-choice quizzes ranging from 3 to 20 questions based on any active document.
* **Persistent Library:** Generated quizzes are fully normalized and persisted in a relational SQL database. Re-access your past tests anytime to track your evolution.
* **Step-by-Step Interactive Practice:** Navigate quizzes via a focused, distraction-free practice wizard. Users receive instant visual correction, score tracking, and detailed concept explanations for every single option.

### 🏎️ 3. Ultra-Fast Client-Side Caching (Zero-Lag Switcher)
* **Session-Persistent LRU Cache:** An optimized in-memory cache system designed to store chat histories per document.
* **Instantaneous Swapping:** Rapidly switching between document workspaces reads history **synchronously**—rendering history *instantly* with zero-latency, zero network calls, and zero loading spinners on hits.
* **Remount-Proof Lifecycle:** Automatically syncs new messages to the cache upon unmounting or during state transitions.

### 🔒 4. Enterprise-Grade Authentication
* **Better Auth Integration:** Modern, multi-session verification utilizing the **Better Auth** library.
* **Secure Session Management:** Supported by a robust database adapter with encrypted email-and-password credentials and strict database schema compliance.

---

## 🏗️ Architectural Flow

Here is how the distinct blocks in EduPulse AI integrate:

### A. Document Upload & Chunking Flow
```mermaid
sequenceDiagram
    actor User
    participant UI as Dashboard Sidebar
    participant API as /api/upload
    participant Storage as Vercel Blob
    participant DB as Prisma (PostgreSQL)

    User->>UI: Select PDF & Click Upload
    UI->>API: Send Multipart Form (file)
    API->>Storage: Store PDF Binary
    Storage-->>API: Return Blob URL
    API->>API: Parse Text (pdf-parse)
    API->>API: Generate Text Chunks
    API->>DB: Save Document Record & DocChunks
    DB-->>UI: Return New Document JSON
    Note over UI: Document List Updates instantly!
```

### B. Intelligent Chat & Cache Loop
```mermaid
flowchart TD
    A[User switches active document] --> B{Is chat in Client Cache?}
    B -- Yes [Hit] --> C[Serve Chat Instantly - Synchronous Render]
    B -- No [Miss] --> D[Show Shimmer & Fetch /api/messages]
    D --> E[Store in Client Cache Map]
    E --> F[Render Chat Workspace]
    
    F --> G[User sends new message]
    G --> H[Stream answer via Vercel AI SDK]
    H --> I[Auto-scroll viewport dynamically]
    I --> J[Write latest messages back to DB]
    J --> K[Update client cache with new messages]
```

### C. Quiz Generation & Storage
```mermaid
sequenceDiagram
    actor User
    participant UI as Quiz Workspace
    participant API as /api/quiz
    participant AI as Gemini 2.5 Flash
    participant DB as Prisma (PostgreSQL)

    User->>UI: Click "Generate Quiz" (count = N)
    UI->>API: POST /api/quiz (documentId, count)
    API->>DB: Fetch Document Raw Text
    API->>AI: generateObject (Zod Schema & Prompt)
    AI-->>API: Structured Quiz JSON (Questions, Options, Key, Reason)
    API->>DB: Create QuizSet + N QuizQuestions in Transaction
    DB-->>UI: Return Persisted Quiz Set
    Note over UI: Practice Library mounts quiz
```

---

## 💾 Database Schema Design

EduPulse AI leverages **Prisma** to manage relationships in the PostgreSQL instance. The schema is normalized to prevent large JSON blobs, ensuring performant filtering, indexability, and clean relationships.

```prisma
model User {
  id            String        @id @default(cuid())
  name          String
  email         String        @unique
  emailVerified Boolean       @default(false)
  image         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  documents     Document[]
  messages      ChatMessage[]
  quizSets      QuizSet[]
  sessions      Session[]
  accounts      Account[]
}

model Document {
  id        String        @id @default(cuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  blobUrl   String
  rawText   String        @db.Text
  chunks    DocChunk[]
  messages  ChatMessage[]
  quizSets  QuizSet[]
  createdAt DateTime      @default(now())
}

model ChatMessage {
  id         String   @id @default(cuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       String
  content    String   @db.Text
  createdAt  DateTime @default(now())

  @@index([documentId])
}

model QuizSet {
  id            String         @id @default(cuid())
  documentId    String
  document      Document       @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  title         String
  questionCount Int
  questions     QuizQuestion[]
  createdAt     DateTime       @default(now())

  @@index([documentId])
  @@index([userId])
}

model QuizQuestion {
  id          String   @id @default(cuid())
  quizSetId   String
  quizSet     QuizSet  @relation(fields: [quizSetId], references: [id], onDelete: Cascade)
  question    String   @db.Text
  options     String[]
  answerIndex Int
  explanation String   @db.Text
  sortOrder   Int

  @@index([quizSetId])
}
```

---

## 🛠️ Technology Stack & Dependencies

* **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
* **AI Orchestration:** [Vercel AI SDK v4](https://sdk.vercel.ai/docs) (`ai` + `@ai-sdk/google`)
* **Core Model:** [Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) (using structural `generateObject` for deterministic quizzes)
* **Auth Platform:** [Better Auth](https://www.better-auth.com/) (using custom Next.js middleware and client endpoints)
* **Database & ORM:** [Prisma ORM](https://www.prisma.io/) with PostgreSQL
* **File Storage:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
* **Parser:** `pdf-parse` for text extraction
* **CSS & Design:** Tailwind CSS with premium dark-mode utilities and Shadcn/ui component blocks (Tabs, Dialogs, Toasts, Cards)

---

## 🚀 Installation & Local Setup

### 📋 Prerequisites
* [Node.js 18.x or higher](https://nodejs.org/)
* A PostgreSQL instance (local or hosted e.g., Supabase, Neon)
* Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/edupulse-ai.git
cd edupulse-ai
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Database Settings
DATABASE_URL="postgresql://user:password@localhost:5432/edupulse"

# Google Gemini API Settings
GOOGLE_GENERATOR_API_KEY="your-gemini-api-key"

# Vercel Blob Credentials (for local, or use Vercel integration)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Better Auth Credentials
BETTER_AUTH_SECRET="a-secure-random-32-char-key"
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Database Migration
Generates your database tables and sets up Prisma Client:
```bash
npx prisma migrate dev --name init
```

### 4. Start the Application
Run the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access your Study Workspace!

---

## 💡 Development Tasks & Commands

* **Run Development Server:** `npm run dev`
* **Build for Production:** `npm run build`
* **Start Production Server:** `npm start`
* **Open Prisma Studio (DB Explorer):** `npx prisma studio`
* **Trigger Type Checks:** `npx tsc --noEmit`
* **Code Linting:** `npm run lint`

---

## 🛣️ Project Roadmap

- [ ] **Vector Search (RAG Integration):** Move beyond simple full-text context and introduce `pgvector` to enable highly targeted queries on massive textbooks.
- [ ] **Collaborative Classrooms:** Share QuizSets and Documents within study groups or classrooms.
- [ ] **AI-driven Weakness Profiling:** Analyze past quiz answers to pinpoint weak conceptual fields and automatically generate customized remedial quizzes.
- [ ] **Multi-Format Ingestion:** Support `.docx`, `.pptx`, and direct web links alongside `.pdf`.

---

## 📄 License & Contributions

Contributions are welcome! Please open an issue or submit a pull request if you have ideas for optimizations or new features.

This project is licensed under the MIT License - see the LICENSE file for details.

*Created with ❤️ to enhance academic learning.*
