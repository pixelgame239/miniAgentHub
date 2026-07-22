import { useCallback, useEffect, useRef } from "react";
import { streamPrompt, type ChatRequest } from "../api/messageApi";
import { useChat } from "./chatHook";

const globalLiveTextMap = new Map<number, string>();
const globalResponseIdMap = new Map<number, number>();

export const useSSEStream = (conversationId: number | undefined) => {
  const {
    streamMap,
    setStreamState,
    clearStreamState,
    appendMessage,
    abortMapRef,
  } = useChat();

  const streamState = conversationId !== undefined
    ? streamMap.get(conversationId)
    : undefined;

  const liveText = streamState?.liveText ?? "";
  const streaming = streamState?.streaming ?? false;

  const start = useCallback(async (
    payload: ChatRequest, 
    onErrorCallback?: (status: number, msg?: string) => void
  ) => {
    if (!payload.conversationId) return;
    const convId = payload.conversationId;

    // Abort stream cũ của đúng conversationId này nếu đang chạy
    abortMapRef.current.get(convId)?.abort();
    const controller = new AbortController();
    abortMapRef.current.set(convId, controller);

    // Reset dữ liệu stream riêng biệt cho convId
    globalLiveTextMap.set(convId, "");
    globalResponseIdMap.delete(convId);
    setStreamState(convId, { liveText: "", streaming: true });

    try {
      await streamPrompt(
        payload,
        {
          onChunk: (token, responseId) => {
            if (controller.signal.aborted) {
              console.warn("[FRONTEND] Tín hiệu abort đã được phát ra, bỏ qua onChunk.");
              return;
            }

            const currentText = (globalLiveTextMap.get(convId) || "") + token;
            globalLiveTextMap.set(convId, currentText);
            
            if (responseId) {
              globalResponseIdMap.set(convId, responseId);
            }

            // Cập nhật State vào Context cho đúng convId
            setStreamState(convId, { liveText: currentText, streaming: true });
          },

          onDone: () => {
            if (controller.signal.aborted) return;

            const resId = globalResponseIdMap.get(convId);
            const finalText = globalLiveTextMap.get(convId) || "";

            clearStreamState(convId);
            abortMapRef.current.delete(convId);
            globalLiveTextMap.delete(convId);
            globalResponseIdMap.delete(convId);

            if (resId) {
              appendMessage(convId, {
                id: resId,
                content: finalText,
                type: "response",
                conversationId: convId,
                createdAt: new Date().toISOString(),
                isCompleted: true,
                aiModel: payload.model
              });
            }
          },

          onError: (err: any) => {
            const resId = globalResponseIdMap.get(convId);

            clearStreamState(convId);
            abortMapRef.current.delete(convId);
            globalLiveTextMap.delete(convId);
            globalResponseIdMap.delete(convId);

            const status = err.status || 500;
            appendMessage(convId, {
              id: resId,
              content: ``,
              type: "error",
              conversationId: convId,
              createdAt: new Date().toISOString(),
              isCompleted: true,
              aiModel: payload.model
            });

            onErrorCallback?.(status, err.message);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      const cachedText = globalLiveTextMap.get(convId) || "";
      const cachedResponseId = globalResponseIdMap.get(convId);

      const isAbort = 
        err.name === "AbortError" || 
        err.message?.toLowerCase().includes("aborted") || 
        controller.signal.aborted;

      clearStreamState(convId);
      abortMapRef.current.delete(convId);
      globalLiveTextMap.delete(convId);
      globalResponseIdMap.delete(convId);

      if (isAbort) {
        console.log(`[FRONTEND] Conv ${convId} stream canceled by user.`);
        if (cachedText && cachedText.trim() && cachedResponseId) {
          appendMessage(convId, {
            id: cachedResponseId,
            content: cachedText,
            type: "response",
            conversationId: convId,
            createdAt: new Date().toISOString(),
            isCompleted: false,
            aiModel: payload.model
          });
        }
      } else {
        console.error("streamPrompt threw:", err);
        const status = err.status || 500;
        onErrorCallback?.(status, err.message);
      }
    }
  }, [setStreamState, clearStreamState, appendMessage, abortMapRef]);

  const currentIdRef = useRef(conversationId);

  useEffect(() => {
    currentIdRef.current = conversationId;
  }, [conversationId]);

  const abort = useCallback(() => {
    console.log("[FRONTEND] Activate abort signal", Date.now());
    const activeId = currentIdRef.current;
    if (activeId === undefined) return;

    clearStreamState(activeId);    
    const controller = abortMapRef.current.get(activeId);
    if (controller) {
      console.log("[FRONTEND] Activate abort signal on controller", Date.now());
      controller.abort();
      abortMapRef.current.delete(activeId);
    }
  }, [abortMapRef, clearStreamState]);

  return { liveText, streaming, start, abort };
};