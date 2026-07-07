import { useCallback, useEffect, useRef } from "react"; // 🛠️ Import thêm useRef
import { streamPrompt, type ChatRequest } from "../api/messageApi";
import { useChat } from "./chatHook";

export const useSSEStream = (conversationId: number | undefined) => {
  const {
    streamMap,
    setStreamState,
    clearStreamState,
    appendMessage,
    abortMapRef,
  } = useChat();

  // Dùng một ref nội bộ để luôn bám sát text đang chạy mà không bị ảnh hưởng bởi việc xóa Map bất đồng bộ
  const currentLiveTextRef = useRef<string>("");
  const currentResponseIdRef = useRef<number | undefined>(undefined);

  const streamState = conversationId !== undefined
    ? streamMap.get(conversationId)
    : undefined;

  const liveText = streamState?.liveText ?? "";
  const streaming = streamState?.streaming ?? false;

  const start = useCallback(async (payload: ChatRequest, onErrorCallback?: (status: number, msg?: string) => void) => {
    if (!payload.conversationId) return;
    const convId = payload.conversationId;

    abortMapRef.current.get(convId)?.abort();
    const controller = new AbortController();
    abortMapRef.current.set(convId, controller);

    currentLiveTextRef.current = ""; // Reset ref cho tin nhắn mới
    currentResponseIdRef.current = undefined;
    setStreamState(convId, { liveText: "", streaming: true });

    try {
      await streamPrompt(
        payload,
        {
          onChunk: (fullAccumulated) => {
            // if (fullAccumulated.startsWith("{") && fullAccumulated.includes('"error":')) {
            //   try {
            //     const parsed = JSON.parse(fullAccumulated);
            //     if (parsed.error) {
            //       onErrorCallback?.(500, parsed.error);
            //       return;
            //     }
            //   } catch {}
            // }
            
            // Ghi nhận vào biến Ref liên tục
            if(controller.signal.aborted) {
              console.warn("[FRONTEND] Tín hiệu abort đã được phát ra, bỏ qua onChunk cuối cùng.");
              return;
            }
            currentLiveTextRef.current = fullAccumulated;
            setStreamState(convId, { liveText: fullAccumulated, streaming: true });
          },

          onDone: ({fullText, responseId, completed}) => {
            if (controller.signal.aborted) return;
            currentResponseIdRef.current = responseId;
            clearStreamState(convId);
            abortMapRef.current.delete(convId);

            if (fullText.trim()) {
              appendMessage(convId, {
                id: responseId,
                content: fullText,
                type: "response",
                conversationId: convId,
                createdAt: new Date().toISOString(),
                isCompleted: completed,
                AIModel: payload.model
              });
            }
          },

          onError: (err: any) => {
            clearStreamState(convId);
            const status = err.status || 500;
            onErrorCallback?.(status, err.message);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      // 🛠️ GIẢI PHÁP: Lấy text trực tiếp từ biến Ref an toàn, không lo Map bị clear trước
      const cachedText = currentLiveTextRef.current;
      const isAbort = 
        err.name === "AbortError" || 
        err.message?.toLowerCase().includes("aborted") || 
        controller.signal.aborted;
      clearStreamState(convId);
      abortMapRef.current.delete(convId);
      if (isAbort) {
        console.log("[FRONTEND] Tín hiệu abort đã được phát ra, bỏ qua onError cuối cùng.");
          if (cachedText && cachedText.trim()) {
            appendMessage(convId, {
              id: currentResponseIdRef.current,
              content: cachedText,
              type: "response",
              conversationId: convId,
              createdAt: new Date().toISOString(),
              isCompleted: false, // Hiện nhãn Chat bị hủy ở UI
              AIModel: payload.model
            });
          }
        } else {
          console.error("streamPrompt threw:", err);
            const status = err.status || 500;
            onErrorCallback?.(status, err.message);
          }

          // 🔥 Sau khi xử lý lưu dữ liệu xong xuôi mới giải phóng State
          clearStreamState(convId);
          abortMapRef.current.delete(convId);
    }
  }, [setStreamState, clearStreamState, appendMessage, abortMapRef]);
  // const currentIdRef = useRef(conversationId);
  // useEffect(() => {
  //   currentIdRef.current = conversationId;
  // }, [conversationId]);
  // Sửa lại hàm abort để đảm bảo đồng bộ
  const abort = useCallback(() => {
    if (conversationId === undefined) return;
    clearStreamState(conversationId);    
    const controller = abortMapRef.current.get(conversationId);
    if (controller) {
      console.log("[FRONTEND] Kích hoạt phát tín hiệu controller.abort() thành công.");
      controller.abort();
      abortMapRef.current.delete(conversationId);
    }
  }, [abortMapRef, clearStreamState, conversationId]);

  return { liveText, streaming, start, abort };
};