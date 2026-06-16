"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  UploadCloud,
  Loader2,
  Trash2,
  AlertTriangle,
  FileText,
  Search,
  X,
} from "lucide-react";
import type { DocumentRecord } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — no longer limited by serverless body size
const SEARCH_THRESHOLD = 5; // show the filter box once the list grows past this

export default function DocumentSidebar({
  documents,
  activeDocumentId,
  onUploadSuccess,
  onSelectDocument,
  onDeleteDocument,
  onClose,
}: {
  documents: DocumentRecord[];
  activeDocumentId: string | null;
  onUploadSuccess?: (doc: DocumentRecord) => void;
  onSelectDocument?: (id: string) => void;
  onDeleteDocument?: (id: string) => void;
  /** When provided, renders a close button in the header (used by the mobile drawer). */
  onClose?: () => void;
}) {
  const hasDocuments = documents.length > 0;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null); // which doc is being deleted (API call)
  const [confirmDoc, setConfirmDoc] = useState<DocumentRecord | null>(null); // dialog open for which doc
  const [isDragging, setIsDragging] = useState(false);
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // ── Core upload pipeline shared by the file picker and drag-and-drop ──────────
  const processFile = async (file: File) => {
    // Client-side validation
    if (file.type && file.type !== "application/pdf") {
      toast({
        title: "Only PDF files are supported.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File exceeds the 10MB upload limit.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress("Uploading...");

    try {
      // Step 1: Upload the file directly to Vercel Blob via client-side upload.
      // The browser sends the file straight to Blob storage — it never passes
      // through the serverless function body, so there's no body size limit.
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        multipart: true,
        onUploadProgress: (progress) => {
          setUploadProgress(`Uploading... ${progress.percentage}%`);
        },
      });

      // Step 2: Now that the file is in Blob storage, ask the server to
      // fetch it from there, parse the PDF text, and save to the database.
      setUploadProgress("Processing PDF...");

      const processResponse = await fetch("/api/upload/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          filename: file.name,
        }),
      });

      if (!processResponse.ok) {
        let errorMessage = "Failed to process PDF.";

        try {
          const data = (await processResponse.json()) as { error?: string };
          if (data?.error) {
            errorMessage = data.error;
          }
        } catch {
          errorMessage = "Failed to process PDF. Please try again.";
        }

        throw new Error(errorMessage);
      }

      const newDoc = await processResponse.json();
      toast({ title: "Document processed!" });
      onUploadSuccess?.(newDoc);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.";

      toast({
        title: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    event.target.value = "";
  };

  // ── Drag-and-drop handlers ────────────────────────────────────────────────────
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    // Only clear when leaving the drop zone itself, not its children.
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDoc) return;
    const doc = confirmDoc;
    setConfirmDoc(null);
    setDeletingId(doc.id);

    try {
      const res = await fetch(`/api/documents?id=${doc.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data?.error ?? "Delete failed");
      }

      onDeleteDocument?.(doc.id);
      toast({ title: `"${doc.title}" deleted.` });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete document.";
      toast({ title: message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const showSearch = documents.length > SEARCH_THRESHOLD;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleDocuments = normalizedQuery
    ? documents.filter((d) => d.title.toLowerCase().includes(normalizedQuery))
    : documents;

  return (
    <>
      {/* ── Confirm Delete Dialog ── */}
      {confirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDoc(null)}
          />
          {/* Dialog panel */}
          <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-sm">Delete document?</p>
                <p className="text-sm text-muted-foreground break-words">
                  <span className="font-medium text-foreground">
                    &ldquo;{confirmDoc.title}&rdquo;
                  </span>{" "}
                  and all its chats and quizzes will be permanently removed.
                  This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDoc(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar body ── */}
      <div
        className="relative flex h-full flex-col bg-sidebar"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-2 z-40 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm pointer-events-none">
            <UploadCloud className="h-7 w-7 text-primary" />
            <p className="text-sm font-medium text-primary">Drop PDF to upload</p>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 p-4 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight truncate">
                EduPulse
              </h1>
              <p className="text-xs text-muted-foreground">Study AI Agent</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close sidebar"
              className="shrink-0 md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="p-3 border-b border-border space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            className="w-full justify-center gap-2"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {isUploading ? uploadProgress || "Uploading..." : "Upload Document"}
          </Button>
          {!isUploading && (
            <p className="text-center text-[11px] text-muted-foreground">
              or drag &amp; drop a PDF here · max 10MB
            </p>
          )}
        </div>

        {showSearch && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="Search documents..."
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
        )}

        {hasDocuments ? (
          <ScrollArea className="flex-1">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documents
                {showSearch && (
                  <span className="ml-1 normal-case tracking-normal">
                    ({visibleDocuments.length})
                  </span>
                )}
              </p>

              {visibleDocuments.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No documents match &ldquo;{query}&rdquo;.
                </p>
              ) : (
                <div className="space-y-1">
                  {visibleDocuments.map((document) => {
                    const isActive = document.id === activeDocumentId;
                    const isDeleting = deletingId === document.id;

                    return (
                      <div key={document.id} className="group relative">
                        <button
                          onClick={() => onSelectDocument?.(document.id)}
                          disabled={isDeleting}
                          className={
                            "w-full text-left pl-3 pr-9 py-2 rounded-lg text-sm border transition-colors flex items-start gap-2.5 " +
                            (isActive
                              ? "bg-primary/10 border-primary/30 text-foreground"
                              : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground")
                          }
                        >
                          <FileText
                            className={
                              "h-4 w-4 mt-0.5 shrink-0 " +
                              (isActive
                                ? "text-primary"
                                : "text-muted-foreground/70")
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium truncate">
                              {document.title}
                            </span>
                            <span className="block text-xs opacity-60 mt-0.5">
                              {new Date(document.createdAt).toLocaleDateString()}
                            </span>
                          </span>
                        </button>

                        {/* Trash / spinner — appears on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDeleting) setConfirmDoc(document);
                          }}
                          disabled={isDeleting}
                          aria-label={`Delete ${document.title}`}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md
                            text-muted-foreground hover:text-destructive hover:bg-destructive/10
                            opacity-0 group-hover:opacity-100 focus:opacity-100
                            transition-all duration-150 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center px-6 text-center">
            <div className="rounded-lg border border-dashed border-border p-6 space-y-2">
              <UploadCloud className="mx-auto h-7 w-7 text-muted-foreground/60" />
              <p className="text-sm font-medium">No documents yet</p>
              <p className="text-xs text-muted-foreground">
                Upload or drop a PDF to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
