"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, Trash2, AlertTriangle } from "lucide-react";
import type { DocumentRecord } from "@/types/index";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

export default function DocumentSidebar({
  documents,
  activeDocumentId,
  onUploadSuccess,
  onSelectDocument,
  onDeleteDocument,
}: {
  documents: DocumentRecord[];
  activeDocumentId: string | null;
  onUploadSuccess?: (doc: DocumentRecord) => void;
  onSelectDocument?: (id: string) => void;
  onDeleteDocument?: (id: string) => void;
}) {
  const hasDocuments = documents.length > 0;
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null); // which doc is being deleted (API call)
  const [confirmDoc, setConfirmDoc] = useState<DocumentRecord | null>(null); // dialog open for which doc
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Upload failed.";

        try {
          const data = (await response.json()) as { error?: string };
          if (data?.error) {
            errorMessage = data.error;
          }
        } catch {
          errorMessage = "Upload failed. Please try again.";
        }

        throw new Error(errorMessage);
      }

      const newDoc = await response.json();
      toast({ title: "Document processed!" });
      onUploadSuccess?.(newDoc);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Upload failed. File might be too large.";

      toast({
        title: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
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
      <div className="flex h-full flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold">EduPulse</h1>
          <p className="text-sm text-muted-foreground">Study AI Agent</p>
        </div>

        <div className="p-3 border-b border-border">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>

        {hasDocuments ? (
          <ScrollArea className="flex-1">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documents
              </p>
              <div className="space-y-1">
                {documents.map((document) => {
                  const isActive = document.id === activeDocumentId;
                  const isDeleting = deletingId === document.id;

                  return (
                    <div key={document.id} className="group relative">
                      <button
                        onClick={() => onSelectDocument?.(document.id)}
                        disabled={isDeleting}
                        className={
                          isActive
                            ? "w-full text-left px-3 py-2 pr-9 rounded-md text-sm bg-accent text-accent-foreground"
                            : "w-full text-left px-3 py-2 pr-9 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        }
                      >
                        <p className="font-medium truncate">{document.title}</p>
                        <p className="text-xs opacity-60 mt-0.5">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </p>
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
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center px-6 text-center">
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <p className="text-sm font-medium">No documents yet</p>
              <p className="text-xs text-muted-foreground">
                Upload a PDF to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
