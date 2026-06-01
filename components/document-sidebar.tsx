import type { DocumentRecord } from "@/types/index";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DocumentSidebar({
  documents,
  activeDocumentId,
}: {
  documents: DocumentRecord[];
  activeDocumentId: string | null;
}) {
  const hasDocuments = documents.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold">EduPulse</h1>
        <p className="text-sm text-muted-foreground">Study AI Agent</p>
      </div>

      <div className="p-3 border-b border-border">
        <Button variant="outline" className="w-full justify-start gap-2">
          <span>+</span>
          Upload Document
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
