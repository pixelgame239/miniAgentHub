// api/messageApi.ts
import { getToken } from "./apiClient";

export type FileUpload = {
  data: string;
  fileName: string;
  mimeType: string;
}
export type ChatRequest = {
  conversationId?: number;
  content?: string;
  model?: string;
  files?: FileUpload[]; 
};

export type SSEHandlers = {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError?: (err: Error) => void;
};

// Defensive: if the chunk is still JSON (Flowise quirk), extract the text
const extractChunkText = (payload: string): string => {
  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed.text === "string") return parsed.text;
    if (typeof parsed.data === "string") return parsed.data;
  } catch {
    // plain text — already extracted by backend
  }
  return payload;
};
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
const apiURL = import.meta.env.VITE_API_URL;
export const streamPrompt = async (
  data: ChatRequest,
  handlers: SSEHandlers,
  signal: AbortSignal
): Promise<void> => {
  const response = await fetch(`${apiURL}/messages/sendPrompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.replace(/^data:\s*/, "").trim();
        if (!payload) continue;

        if (payload === "[DONE]") {
          // Fire onDone with what we have so far, then stop — don't touch accumulated after this
          handlers.onDone(accumulated);
          return;
        }

        if (payload.startsWith("[ERROR]")) {
          handlers.onError?.(new Error(payload.replace("[ERROR]", "").trim()));
          return;
        }

        const text = extractChunkText(payload);
        if (!text) continue;

        accumulated += text;
        handlers.onChunk(accumulated); // pass full accumulated so display is always correct
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Stream ended without [DONE] — still resolve cleanly
  handlers.onDone(accumulated);
};