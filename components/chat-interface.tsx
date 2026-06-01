"use client";

import { useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatInterface({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    id: documentId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { documentId },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h2 className="font-semibold truncate">{documentTitle}</h2>
        <p className="text-sm text-muted-foreground">
          Ask anything about this document
        </p>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              Start by asking a question about your document
            </div>
          ) : (
            messages.map((message: UIMessage) => (
              <div
                key={message.id}
                className={
                  message.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm"
                      : "bg-muted text-muted-foreground px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] text-sm"
                  }
                >
                  <p className="whitespace-pre-wrap">
                    {message.parts.map(
                      (part: UIMessage["parts"][number], partIndex: number) =>
                      part.type === "text" ? (
                        <span key={`${message.id}-${partIndex}`}>{part.text}</span>
                      ) : null
                    )}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading ? (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-sm text-sm text-muted-foreground">
                Thinking...
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="Ask about this document..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
