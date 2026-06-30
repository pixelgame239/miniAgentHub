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
    console.log("Response not ok:", response.status, response.statusText);
    try {
      const errBody = await response.json();
      if (errBody.message) errorObj.message = errBody.message;
    } catch {
    }
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
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
      if (!line.startsWith("data:")) continue;

        // Thay vì regex phức tạp, cắt chính xác tiền tố "data:"
        const payload = line.replace(/^data:\s?/, "");
        if (payload === "") continue;

        if (payload === "[DONE]" || payload.trim() === "[DONE]") {
          handlers.onDone(accumulated);
          return;
        }
        try {
            const parsedPayload = JSON.parse(payload.trim());
            
            // Nếu object nhận được có chứa flag error từ Backend gửi sang
            if (parsedPayload && parsedPayload.error) {
              const customError = new Error(parsedPayload.message || "Stream error") as any;
              customError.status = parsedPayload.status || 500; // Lấy đúng mã 400 hoặc 500 từ Backend
              
              handlers.onError?.(customError); // Kích hoạt sự kiện Error ở Hook
              return;
            }
          } catch {
            // Nếu không parse được JSON, tức là payload này là chuỗi text chunk bình thường từ AI
          }
      const text = extractChunkText(payload);
        
        // CHÚ Ý: Không continue nếu text là ký tự xuống dòng hoặc khoảng trắng trống
        // Chỉ continue nếu text thực sự rỗng do lỗi metadata từ Flowise
        if (text === "" && !payload.includes("\n")) continue; 

        accumulated += text;
        handlers.onChunk(accumulated);
      }
    }
  } finally {
    reader.releaseLock();
  }

  handlers.onDone(accumulated);
};