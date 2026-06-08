// hooks/useSSEStream.ts
import { useCallback } from "react";
import { streamPrompt, type ChatRequest } from "../api/messageApi";
import { useChat } from "./chatHook";

export const useSSEStream = (conversationId: number | undefined) => {
  const {
    streamMap, setStreamState, clearStreamState,
    appendMessage, abortMapRef,
  } = useChat();

  const streamState = conversationId !== undefined
    ? streamMap.get(conversationId)
    : undefined;

  const liveText = streamState?.liveText ?? "";
  const streaming = streamState?.streaming ?? false;

  const start = useCallback(async (payload: ChatRequest) => {
    if (!payload.conversationId) return;
    const convId = payload.conversationId;

    // Only abort THIS conversation's own previous stream — never another tab's
    abortMapRef.current.get(convId)?.abort();

    const controller = new AbortController();
    abortMapRef.current.set(convId, controller);
    setStreamState(convId, { liveText: "", streaming: true });

    await streamPrompt(
      payload,
      {
        onChunk: (accumulated) => {
          setStreamState(convId, { liveText: accumulated, streaming: true });
        },
        onDone: (fullText) => {
          clearStreamState(convId);
          abortMapRef.current.delete(convId);
          // Write to context — works even when this conversation's tab is not active
          if (fullText) {
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
    ).catch((err) => {
      if (err.name !== "AbortError") console.error(err);
      clearStreamState(convId);
      abortMapRef.current.delete(convId);
    });
  }, [setStreamState, clearStreamState, appendMessage, abortMapRef]);

  const abort = useCallback(() => {
    if (conversationId === undefined) return;
    abortMapRef.current.get(conversationId)?.abort();
    abortMapRef.current.delete(conversationId);
    clearStreamState(conversationId);
  }, [conversationId, clearStreamState, abortMapRef]);

  return { liveText, streaming, start, abort };
};