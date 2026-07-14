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
          onChunk: (token, responseId) => {
            // Ghi nhận vào biến Ref liên tục
            if(controller.signal.aborted) {
              console.warn("[FRONTEND] Tín hiệu abort đã được phát ra, bỏ qua onChunk cuối cùng.");
              return;
            }
            currentLiveTextRef.current += token;
            if(responseId) currentResponseIdRef.current = responseId;
            setStreamState(convId, { liveText: currentLiveTextRef.current, streaming: true });
          },

          onDone: () => {
            if (controller.signal.aborted) return;
            const resId = currentResponseIdRef.current;
            clearStreamState(convId);
            abortMapRef.current.delete(convId);
            if (resId) {
              appendMessage(convId, {
                id: resId,
                content: currentLiveTextRef.current,
                type: "response",
                conversationId: convId,
                createdAt: new Date().toISOString(),
                isCompleted: true,
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
      const cachedResponseId = currentResponseIdRef.current;
      const isAbort = 
        err.name === "AbortError" || 
        err.message?.toLowerCase().includes("aborted") || 
        controller.signal.aborted;
      clearStreamState(convId);
      abortMapRef.current.delete(convId);
      if (isAbort) {
        console.log("[FRONTEND] Tín hiệu abort đã được phát ra, bỏ qua onError cuối cùng.");
          if (cachedText && cachedText.trim()&& cachedResponseId) {
            appendMessage(convId, {
              id: cachedResponseId,
              content: cachedText,
              type: "response",
              conversationId: convId,
              createdAt: new Date().toISOString(),
              isCompleted: false, // Hiện nhãn Chat bị hủy ở UI
              AIModel: payload.model
            });
          }
        } 
        else {
          console.error("streamPrompt threw:", err);
            const status = err.status || 500;
            onErrorCallback?.(status, err.message);
          }
          // 🔥 Sau khi xử lý lưu dữ liệu xong xuôi mới giải phóng State
          clearStreamState(convId);
          abortMapRef.current.delete(convId);
    }
  }, [setStreamState, clearStreamState, appendMessage, abortMapRef]);
  const currentIdRef = useRef(conversationId);

  useEffect(() => {
    currentIdRef.current = conversationId;
  }, [conversationId]);
  const abort = useCallback(() => {
    console.log("[FRONTEND] Kích hoạt abort() từ Hook useSSEStream.", Date.now());
    const activeId = currentIdRef.current;
    if (activeId === undefined) return;
    clearStreamState(activeId);    
    const controller = abortMapRef.current.get(activeId);
    if (controller) {
      console.log("[FRONTEND] Kích hoạt phát tín hiệu controller.abort() thành công.");
      controller.abort();
      abortMapRef.current.delete(activeId);
    }
  }, [abortMapRef, clearStreamState]);

  return { liveText, streaming, start, abort };
};