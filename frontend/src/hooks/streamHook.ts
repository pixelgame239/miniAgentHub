import { useCallback, useRef } from "react"; // 🛠️ Import thêm useRef
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
    setStreamState(convId, { liveText: "", streaming: true });

    try {
      await streamPrompt(
        payload,
        {
          onChunk: (fullAccumulated) => {
            if (fullAccumulated.startsWith("{") && fullAccumulated.includes('"error":')) {
              try {
                const parsed = JSON.parse(fullAccumulated);
                if (parsed.error) {
                  onErrorCallback?.(500, parsed.error);
                  return;
                }
              } catch {}
            }
            
            // Ghi nhận vào biến Ref liên tục
            currentLiveTextRef.current = fullAccumulated;
            setStreamState(convId, { liveText: fullAccumulated, streaming: true });
          },

          onDone: (fullText) => {
            clearStreamState(convId);
            abortMapRef.current.delete(convId);

            if (fullText.trim()) {
              appendMessage(convId, {
                content: fullText,
                type: "response",
                conversationId: convId,
                createdAt: new Date().toISOString(),
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

      clearStreamState(convId);
      abortMapRef.current.delete(convId);

      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        if (cachedText && cachedText.trim()) {
          appendMessage(convId, {
            content: cachedText,
            type: "response",
            conversationId: convId,
            createdAt: new Date().toISOString(),
            isCompleted: false, // Hiện nhãn t("chat.abortChat") đỏ/xám dưới UI
            AIModel: payload.model
          });
        }
      } else {
        console.error("streamPrompt threw:", err);
        const status = err.status || 500;
        onErrorCallback?.(status, err.message);
      }
    }
  }, [setStreamState, clearStreamState, appendMessage, abortMapRef]);

  // Sửa lại hàm abort để đảm bảo đồng bộ
  const abort = useCallback(() => {
    if (conversationId === undefined) return;
    
    // Phát tín hiệu dừng
    abortMapRef.current.get(conversationId)?.abort();
    abortMapRef.current.delete(conversationId);
    clearStreamState(conversationId);
  }, [conversationId, clearStreamState, abortMapRef]);

  return { liveText, streaming, start, abort };
};