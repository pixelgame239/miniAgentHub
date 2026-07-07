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
  onDone: (result: { fullText: string; responseId: number; completed: boolean }) => void;
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
  let isAnalysisChannel = false;

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
        if(signal.aborted) {
          throw new DOMException("The user aborted a request.", "AbortError");
        }
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.replace(/^data:\s?/, "");
        if (payload === "") continue;

        try{
          const parsedPayload = JSON.parse(payload);
          if (payload === "[DONE]") {
            console.log("[FRONTEND API] Nhận tín hiệu kết thúc chính thức [DONE]. Giải phóng luồng.");
            handlers.onDone({ 
              fullText: accumulated, 
              responseId: parsedPayload?.responseId, // 🔥 Tận dụng dữ liệu ID đã parse được từ block trước nếu có
              completed: true 
            });
            return; 
          }
          if(parsedPayload&&parsedPayload.error){
            const customError = new Error(parsedPayload.message || "Stream error") as any;
            customError.status = parsedPayload.status || 500;
            handlers.onError?.(customError);
            return;
          }
          if(parsedPayload&&parsedPayload.streamFinished){
            handlers.onDone({ fullText: accumulated, responseId: parsedPayload.responseId, completed: parsedPayload.completed });
            return;
          }
          const delta = parsedPayload.choices?.[0]?.delta;
          if (delta) {
            // Kiểm tra xem token này thuộc kênh nào
            if (delta.channel === "analysis" || delta.reasoning !== undefined) {
              isAnalysisChannel = true;
            } else if (delta.content !== undefined || (delta.channel && delta.channel !== "analysis")) {
              isAnalysisChannel = false;
            }
          }
          let token = "";
          if (!isAnalysisChannel) {
            if (delta && typeof delta.content === "string") {
              token = delta.content;
            } else if (parsedPayload.event === "token" && typeof parsedPayload.data === "string") {
              token = parsedPayload.data; // Định dạng Flowise
            }
          }
          if (token) {
            accumulated += token;
            handlers.onChunk(accumulated);
          }
        }catch{}
      }
    }
  } catch (err: any) {
    // Nếu là lỗi hủy, ném ra ngoài cho hook useSSEStream xử lý, TUYỆT ĐỐI không gọi handlers.onDone
    throw err;
  } finally {
    reader.releaseLock();
  }
};