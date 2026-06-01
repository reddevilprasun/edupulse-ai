"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import type { DocumentRecord } from "@/types/index";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

export default function DocumentSidebar({
  documents,
  activeDocumentId,
  onUploadSuccess,
  onSelectDocument,
}: {
  documents: DocumentRecord[];
  activeDocumentId: string | null;
  onUploadSuccess?: (doc: DocumentRecord) => void;
  onSelectDocument?: (id: string) => void;
}) {
  const hasDocuments = documents.length > 0;
  const [isUploading, setIsUploading] = useState(false);
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

  return (
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
              {documents.map((document) => (
                <button
                  key={document.id}
                  onClick={() => onSelectDocument?.(document.id)}
                  className={
                    document.id === activeDocumentId
                      ? "w-full text-left px-3 py-2 rounded-md text-sm bg-accent text-accent-foreground"
                      : "w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  }
                >
                  <p className="font-medium truncate">{document.title}</p>
                  <p className="text-xs opacity-60 mt-0.5">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
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
  );
}
