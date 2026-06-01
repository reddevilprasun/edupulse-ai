export type DocumentRecord = {
  id: string;
  userId: string;
  title: string;
  blobUrl: string;
  rawText: string;
  createdAt: Date;
};

export type ChatMessageRecord = {
  id: string;
  documentId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sortOrder: number;
};

export type QuizSetRecord = {
  id: string;
  title: string;
  questionCount: number;
  createdAt: Date;
  questions: QuizQuestion[];
};

export type DocChunkRecord = {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  createdAt: Date;
};
