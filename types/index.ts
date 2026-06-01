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
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
};

export type DocChunkRecord = {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  createdAt: Date;
};
