"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import type { DocumentRecord } from "@/types/index";
import { invalidateCachedHistory } from "@/lib/chat-history-cache";

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 520;
const SIDEBAR_DEFAULT = 280;

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(SIDEBAR_DEFAULT);
  const router = useRouter();
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

  // ── Resizable divider ──────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  // ── Delete document ────────────────────────────────────────────────────────
  const handleDeleteDocument = (deletedId: string) => {
    // Evict from chat cache so stale messages don't linger
    invalidateCachedHistory(deletedId);
    setDocuments((prev) => prev.filter((d) => d.id !== deletedId));
    if (activeDocumentId === deletedId) {
      setActiveDocumentId(null);
    }
  };

  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside
        style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
        className="flex flex-col border-r border-border overflow-hidden shrink-0"
      >
        <DocumentSidebar
          documents={documents}
          activeDocumentId={activeDocumentId}
          onSelectDocument={setActiveDocumentId}
          onUploadSuccess={(doc) => {
            setDocuments((prev) => [doc, ...prev]);
            setActiveDocumentId(doc.id);
          }}
          onDeleteDocument={handleDeleteDocument}
        />
      </aside>

      {/* ── Resizable divider ── */}
      <div
        onMouseDown={onMouseDown}
        className="w-1 shrink-0 cursor-col-resize relative group select-none"
        title="Drag to resize"
      >
        {/* Visible grab line */}
        <div className="absolute inset-y-0 left-0 w-full group-hover:bg-primary/40 transition-colors duration-150 bg-border" />
        {/* Wider invisible hit area */}
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>

      {/* ── Main workspace ── */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard</p>
            <h1 className="text-lg font-semibold">Study Workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? ""} alt={session.user.name} />
                  <AvatarFallback>{session.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block">{session.user.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sign out"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
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
                  key={activeDocument.id}
                  documentId={activeDocument.id}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
