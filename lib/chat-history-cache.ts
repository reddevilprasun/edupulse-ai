/**
 * Client-side in-memory cache for chat history.
 *
 * Lives at the module level — survives component remounts (e.g. switching
 * documents) for the lifetime of the browser session. Cleared on full page
 * refresh.
 *
 * Max entries: 50 documents. Oldest entry is evicted when the cap is hit to
 * prevent unbounded memory growth in long sessions.
 */

import type { UIMessage } from "ai";

const MAX_ENTRIES = 50;
const cache = new Map<string, UIMessage[]>();

export function getCachedHistory(documentId: string): UIMessage[] | undefined {
  return cache.get(documentId);
}

export function setCachedHistory(documentId: string, messages: UIMessage[]): void {
  // Evict oldest entry if at capacity
  if (!cache.has(documentId) && cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(documentId, messages);
}

export function invalidateCachedHistory(documentId: string): void {
  cache.delete(documentId);
}
