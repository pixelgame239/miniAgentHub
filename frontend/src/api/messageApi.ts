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
  APIKey?: string;
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
    const parsed = JSON.parse(payload.trim()); 
    if (parsed.event === "token" && typeof parsed.data === "string") return parsed.data;
    if (parsed.event) return "";
    if (typeof parsed.text === "string") return parsed.text;
  } catch {
    // already plain text from backend
  }
  return payload; // plain text passthrough
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

        // ✅ Only strip the "data:" prefix — do NOT .trim() the value
        const payload = line.slice("data:".length);
        if (payload === "") continue;

        if (payload.trim() === "[DONE]") {
          handlers.onDone(accumulated);
          return;
        }
        if (payload.trim().startsWith("[ERROR]")) {
          handlers.onError?.(new Error(payload.trim().replace("[ERROR]", "").trim()));
          return;
        }

        const text = extractChunkText(payload);
        if (text === "") continue; // skip non-token events (metadata, agentReasoning…)

        accumulated += text;
        handlers.onChunk(accumulated);
      }
    }
  } finally {
    reader.releaseLock();
  }

  handlers.onDone(accumulated);
};