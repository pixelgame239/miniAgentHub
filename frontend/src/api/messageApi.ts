// api/messageApi.ts
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
  onChunk: (text: string, responseId: number) => void;
  onDone: () => void;
  onError?: (err: Error) => void;
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
  let response: Response;

  try {
    response = await fetch(`${apiURL}/messages/sendPrompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: signal,
      credentials: "include",
    });
  } catch (err: any) {
    // Nếu là lỗi Abort do người dùng hủy request, ném ra ngoài luôn
    throw err; 
  }

  // --- ĐOẠN KIỂM TRA HẾT HẠN TOKEN NẰM Ở ĐÂY ---
  if (!response.ok) {
    const errorObj = new Error(`Request failed with status ${response.status}`) as any;
    errorObj.status = response.status; 
    
    try {
      const errBody = await response.json();
      if (errBody.message) errorObj.message = errBody.message;
      
      // Kiểm tra nếu Backend báo lỗi hết hạn token (TOKEN_EXPIRED)
      if (errBody.errorCode === "TOKEN_EXPIRED" || response.status === 401) {
        console.log("Access token expired. Attempting to refresh...");
        
        const refreshResponse = await fetch(`${apiURL}/auth/refreshAccessToken`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          console.log("Token refreshed successfully. Retrying the original request...");
          return await streamPrompt(data, handlers, signal);
        } else {
          console.error("Refresh token expired or invalid. Redirection to login needed.");
          throw new Error("SESSION_EXPIRED");
        }
      }
    } catch (e: any) {
      // Nếu lỗi văng ra từ việc refresh token, ném lỗi đó ra ngoài
      if (e.message === "SESSION_EXPIRED") throw e;
    }
    
    throw errorObj; 
  }

  if (!response.body) {
    throw new Error("Response body is non-readable or null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (signal.aborted) {
          throw new DOMException("The user aborted a request.", "AbortError");
        }
        const trimmed = line.trim();
        if (!trimmed.startsWith("stream:")) continue;

        const payload = trimmed.replace(/^stream:\s?/, "");

        if (payload === "") continue;
        try {
          const parsedPayload = JSON.parse(payload);
          if (parsedPayload.error) {
            const customError = new Error(parsedPayload.message || "Stream error") as any;
            handlers.onError?.(customError);
            return;
          }
          if(parsedPayload.event === "error") {
            const customError = new Error(parsedPayload.message || "Stream error") as any;
            handlers.onError?.(customError);
            return;
          }
          
          const resId = parsedPayload.responseId;
          const token = parsedPayload.data|| "";

          if (token) {
            handlers.onChunk(token, resId);
          }
        } catch {
          throw new Error("Failed to parse SSE payload: " + payload);
        }
      }
    }
    handlers.onDone();
  } catch (err: any) {
    throw err;
  } finally {
    reader.releaseLock();
  }
};