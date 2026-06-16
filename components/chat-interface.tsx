"use client";

import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import {
  getCachedHistory,
  setCachedHistory,
} from "@/lib/chat-history-cache";

const SUGGESTED_PROMPTS = [
  "Summarize this document",
  "What are the key points?",
  "Explain the main concepts simply",
  "Quiz me on this material",
];

// Pull the plain-text content out of a UIMessage's parts.
function messageText(message: UIMessage): string {
  return message.parts
    .filter((p: UIMessage["parts"][number]) => p.type === "text")
    .map((p: UIMessage["parts"][number]) => (p as { type: "text"; text: string }).text)
    .join("");
}

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-grow the textarea up to a max height, then let it scroll.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!input.trim() || isLoading) return;
      setChatError(null);
      sendMessage({ text: input });
      setInput("");
    }
  };

  const sendPrompt = (text: string) => {
    if (isLoading) return;
    setChatError(null);
    sendMessage({ text });
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — fail silently.
    }
  };

  return (
    <>
      <ScrollArea className="flex-1 min-h-0 px-4 md:px-6">
        <div className="py-4 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Ask anything about your document</p>
                <p className="text-sm text-muted-foreground">
                  Pick a suggestion below or type your own question.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendPrompt(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message: UIMessage) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={
                    "flex gap-2.5 " + (isUser ? "justify-end" : "justify-start")
                  }
                >
                  {/* Assistant avatar */}
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={
                      "group min-w-0 " + (isUser ? "max-w-[85%]" : "max-w-[85%]")
                    }
                  >
                    <div
                      className={
                        isUser
                          ? "bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm shadow-sm"
                          : "bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm"
                      }
                    >
                      {isUser ? (
                        // User messages: plain text
                        <p className="whitespace-pre-wrap break-words">
                          {messageText(message)}
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
                            {messageText(message)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Copy button on assistant messages */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(message.id, messageText(message))}
                        aria-label="Copy message"
                        className="mt-1 ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* User avatar */}
                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted px-4 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
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

      <div className="px-4 md:px-6 py-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 flex items-end rounded-2xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:ring-3 focus-within:ring-ring/20">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                chatError
                  ? "Fix the issue above, then try again..."
                  : "Ask about this document...  (Shift + Enter for a new line)"
              }
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 max-h-40"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 rounded-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
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
      <div className="px-4 md:px-6 py-4 border-b border-border shrink-0">
        <h2 className="font-semibold truncate">{documentTitle}</h2>
        <p className="text-sm text-muted-foreground">
          Ask anything about this document
        </p>
      </div>

      {historyError && (
        <div className="px-4 md:px-6 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-xs text-destructive shrink-0">
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
