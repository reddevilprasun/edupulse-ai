"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  getCachedHistory,
  setCachedHistory,
} from "@/lib/chat-history-cache";

// ─── Inner chat component ───────────────────────────────────────────────────
// Only mounts AFTER history is loaded → useChat is initialized with correct messages.
// On unmount it writes the latest messages back to the cache so a rapid
// document switch never needs to re-hit the network.
function ChatInner({
  documentId,
  initialMessages,
}: {
  documentId: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    id: documentId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { documentId },
    }),
    onError: (error) => {
      const raw = error?.message ?? "";
      let msg = "Something went wrong. Please try again.";

      if (
        raw.includes("429") ||
        raw.toLowerCase().includes("quota") ||
        raw.toLowerCase().includes("rate limit")
      ) {
        msg =
          "⚠️ AI quota exceeded. You have reached the usage limit. Please try again later.";
      } else if (raw.includes("503") || raw.toLowerCase().includes("overload")) {
        msg =
          "⚠️ The AI service is temporarily overloaded. Please wait a moment and try again.";
      } else if (
        raw.includes("401") ||
        raw.includes("403") ||
        raw.toLowerCase().includes("api key")
      ) {
        msg = "⚠️ AI service authentication error. Please contact support.";
      } else if (raw.includes("504") || raw.toLowerCase().includes("timeout")) {
        msg =
          "⚠️ The request timed out. Please check your connection and try again.";
      } else if (
        raw.toLowerCase().includes("network") ||
        raw.toLowerCase().includes("fetch")
      ) {
        msg =
          "⚠️ Network error. Please check your internet connection and try again.";
      } else if (raw.length > 0) {
        msg = `⚠️ ${raw}`;
      }

      setChatError(msg);
    },
  });

  // Always keep a ref to the latest messages so the cleanup can read it without
  // needing messages in the dependency array (avoids re-registering cleanup).
  const latestMessagesRef = useRef(messages);
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  // Write latest messages back to cache when this document's chat unmounts
  // (e.g. user switches to another document).
  useEffect(() => {
    return () => {
      setCachedHistory(documentId, latestMessagesRef.current);
    };
  }, [documentId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatError]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    setChatError(null);
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <>
      <ScrollArea className="flex-1 min-h-0 px-6">
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
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm"
                      : "bg-muted text-muted-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm"
                  }
                >
                  {message.role === "user" ? (
                    // User messages: plain text
                    <p className="whitespace-pre-wrap">
                      {message.parts.map(
                        (part: UIMessage["parts"][number], partIndex: number) =>
                          part.type === "text" ? (
                            <span key={`${message.id}-${partIndex}`}>
                              {part.text}
                            </span>
                          ) : null
                      )}
                    </p>
                  ) : (
                    // Assistant messages: full markdown rendering
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      prose-p:my-1 prose-p:leading-relaxed
                      prose-headings:font-semibold prose-headings:my-2
                      prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                      prose-ol:my-1 prose-ol:pl-4
                      prose-code:bg-black/20 prose-code:dark:bg-white/10
                      prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-black/30 prose-pre:dark:bg-white/5
                      prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-2
                      prose-pre:overflow-x-auto prose-pre:text-xs
                      prose-blockquote:border-l-2 prose-blockquote:border-primary/50
                      prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-muted-foreground
                      prose-table:text-xs prose-th:font-semibold
                      prose-strong:font-semibold prose-strong:text-foreground
                      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.parts
                          .filter((p: UIMessage["parts"][number]) => p.type === "text")
                          .map((p: UIMessage["parts"][number]) => (p as { type: "text"; text: string }).text)
                          .join("")}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-sm text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
                Thinking...
              </div>
            </div>
          )}

          {chatError && !isLoading && (
            <div className="flex justify-start">
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{chatError}</span>
                </div>
                <button
                  onClick={() => setChatError(null)}
                  className="flex items-center gap-1.5 text-xs underline-offset-2 hover:underline self-end opacity-70 hover:opacity-100"
                >
                  <RefreshCw className="h-3 w-3" />
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder={
              chatError
                ? "Fix the issue above, then try again..."
                : "Ask about this document..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </>
  );
}

// ─── Outer component: serves cache → fetches network if miss ─────────────────
export default function ChatInterface({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  // Initialise synchronously from cache (no loading flash on cache hit).
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    () => getCachedHistory(documentId) ?? null
  );
  const [historyError, setHistoryError] = useState(false);

  useEffect(() => {
    // Cache hit → render immediately, skip the network fetch entirely.
    if (getCachedHistory(documentId) !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialMessages(getCachedHistory(documentId)!);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistoryError(false);
      return;
    }

    // Cache miss → fetch from API.
    setInitialMessages(null);
    setHistoryError(false);

    fetch(`/api/messages?documentId=${documentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: UIMessage[]) => {
        const msgs = Array.isArray(data) ? data : [];
        setCachedHistory(documentId, msgs); // warm the cache
        setInitialMessages(msgs);
      })
      .catch(() => {
        setHistoryError(true);
        setInitialMessages([]); // allow chatting even on history failure
      });
  }, [documentId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h2 className="font-semibold truncate">{documentTitle}</h2>
        <p className="text-sm text-muted-foreground">
          Ask anything about this document
        </p>
      </div>

      {historyError && (
        <div className="px-6 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-xs text-destructive shrink-0">
          <AlertCircle className="h-3 w-3" />
          Could not load chat history. You can still send new messages.
        </div>
      )}

      {/* Only mount ChatInner once history is ready — prevents useChat
          initialising with wrong/empty messages. Cache hits are synchronous
          so there is no loading flash when history is already cached. */}
      {initialMessages === null ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading conversation history...
        </div>
      ) : (
        <ChatInner
          documentId={documentId}
          initialMessages={initialMessages}
        />
      )}
    </div>
  );
}
