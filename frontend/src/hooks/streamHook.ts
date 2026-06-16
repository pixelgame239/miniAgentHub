import { useCallback } from "react";
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

  // Read this conversation's stream state from the shared map.
  // When convId changes (tab switch), this just reads a different key —
  // nothing is aborted, nothing is reset.
  const streamState = conversationId !== undefined
    ? streamMap.get(conversationId)
    : undefined;

  const liveText = streamState?.liveText ?? "";
  const streaming = streamState?.streaming ?? false;

  const start = useCallback(async (payload: ChatRequest) => {
    if (!payload.conversationId) return;
    const convId = payload.conversationId;

    // Only abort a previous stream for THIS same conversation
    // (e.g. user hits send twice in the same box before the first finishes)
    abortMapRef.current.get(convId)?.abort();
    const controller = new AbortController();
    abortMapRef.current.set(convId, controller);

    setStreamState(convId, { liveText: "", streaming: true });

    try {
      await streamPrompt(
        payload,
        {
          onChunk: (fullAccumulated) => {
            // Write to this conversation's slot — works even when the tab
            // is not visible, because streamMap is in context not in the component
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

          onError: (err) => {
            console.error("Stream error:", err);
            clearStreamState(convId);
            abortMapRef.current.delete(convId);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== "AbortError") console.error("streamPrompt threw:", err);
      clearStreamState(convId);
      abortMapRef.current.delete(convId);
    }
  }, [setStreamState, clearStreamState, appendMessage, abortMapRef]);

  const abort = useCallback(() => {
    if (conversationId === undefined) return;
    abortMapRef.current.get(conversationId)?.abort();
    abortMapRef.current.delete(conversationId);
    clearStreamState(conversationId);
  }, [conversationId, clearStreamState, abortMapRef]);

  return { liveText, streaming, start, abort };
};