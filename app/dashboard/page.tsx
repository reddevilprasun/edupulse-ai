"use client";

import { useState, useEffect } from "react";
import DocumentSidebar from "@/components/document-sidebar";
import ChatInterface from "@/components/chat-interface";
import QuizDisplay from "@/components/quiz-display";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";
import type { DocumentRecord, QuizQuestion } from "@/types/index";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error("Failed to fetch documents", error);
      }
    }
    
    if (session) {
      fetchDocuments();
    }
  }, [session]);

  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? null;

  const handleGenerateQuiz = async () => {
    if (!activeDocumentId) {
      return;
    }

    setIsQuizLoading(true);
    setQuizQuestions([]);

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId: activeDocumentId }),
      });

      const data = await response.json();
      setQuizQuestions(data.questions ?? []);
    } catch {
      setIsQuizLoading(false);
      return;
    }

    setIsQuizLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DocumentSidebar
        documents={documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={setActiveDocumentId}
        onUploadSuccess={(doc) => {
          setDocuments((prev) => [doc, ...prev]);
          setActiveDocumentId(doc.id);
        }}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard</p>
            <h1 className="text-lg font-semibold">Study Workspace</h1>
          </div>
          <div className="flex items-center gap-4">
            {session && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? ""} alt={session.user.name} />
                  <AvatarFallback>{session.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{session.user.name}</span>
              </div>
            )}
            <ModeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-hidden min-h-0">
          {!activeDocument ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <p className="text-lg font-medium">Select a document to begin</p>
              <p className="text-sm">
                Upload a PDF from the sidebar to get started
              </p>
            </div>
          ) : (
            <Tabs defaultValue="chat" className="flex flex-col h-full min-h-0">
              <TabsList className="mx-6 mt-4 w-fit shrink-0">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="flex-1 min-h-0 overflow-hidden mt-0 flex flex-col">
                <ChatInterface
                  key={activeDocument.id}
                  documentId={activeDocument.id}
                  documentTitle={activeDocument.title}
                />
              </TabsContent>
              <TabsContent value="quiz" className="flex-1 min-h-0 overflow-hidden mt-0 flex flex-col">
                <QuizDisplay
                  questions={quizQuestions}
                  isLoading={isQuizLoading}
                  onGenerate={handleGenerateQuiz}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
