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
  APIKey?: string|null;
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
    // Không dùng .trim() ở payload, parse trực tiếp JSON thô
    const parsed = JSON.parse(payload); 
    
    // Nếu là định dạng chuẩn OpenAI/Groq/OpenRouter như log bạn gửi:
    if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
      const delta = parsed.choices[0].delta;
      if (delta && typeof delta.content === "string") {
        return delta.content; // Trả về chính xác token (Giữ nguyên dấu cách, \n)
      }
    }
    
    // Định dạng Flowise
    if (parsed.event === "token" && typeof parsed.data === "string") return parsed.data;
    if (parsed.event) return "";
    if (typeof parsed.text === "string") return parsed.text;
  } catch {
    // Trường hợp là plain text do backend đã bóc tách sẵn
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

  if (!response.ok) {
    const errorObj = new Error(`Request failed with status ${response.status}`) as any;
    errorObj.status = response.status; 
    try {
      const errBody = await response.json();
      if (errBody.message) errorObj.message = errBody.message;
    } catch {}
    throw errorObj; 
  }

  if (!response.body) {
    throw new Error("Response body is non-readable or null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      // Nếu signal đã bị hủy trước loạt read tiếp theo, tự chủ động break/throw
      if (signal.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const payload = line.replace(/^data:\s?/, "");
        if (payload === "") continue;

        if (payload === "[DONE]" || payload.trim() === "[DONE]") {
          handlers.onDone(accumulated);
          return;
        }

        try {
          const parsedPayload = JSON.parse(payload.trim());
          if (parsedPayload && parsedPayload.error) {
            const customError = new Error(parsedPayload.message || "Stream error") as any;
            customError.status = parsedPayload.status || 500;
            handlers.onError?.(customError);
            return;
          }
        } catch {}

        const text = extractChunkText(payload);
        if (text === "" && !payload.includes("\n")) continue; 

        accumulated += text;
        handlers.onChunk(accumulated);
      }
    }

    // Chỉ gọi onDone nếu luồng kết thúc tự nhiên và KHÔNG bị hủy
    if (!signal.aborted) {
      handlers.onDone(accumulated);
    }
  } catch (err: any) {
    // Nếu là lỗi hủy, ném ra ngoài cho hook useSSEStream xử lý, TUYỆT ĐỐI không gọi handlers.onDone
    throw err;
  } finally {
    reader.releaseLock();
  }
};