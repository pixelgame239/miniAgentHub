import { useEffect, useRef, useState } from "react";
import styles from "../styles/chat.module.css";
import { useRouteLoaderData } from "react-router";
import type { AIModels } from "../loader/aiLoader";
import { useChat } from "../hooks/chatHook";
import { createConversation } from "../api/conversationApi";
import { useStream } from "@hyper-fetch/react";
import { type ChatRequest, sendPromptRequest } from "../api/messageApi";
import type { Message } from "../context/ChatContext";
import type { Group } from "../loader/groupLoader";
import { useTranslation } from "react-i18next";

const ChatPage = () => {
  const { AIModels } = useRouteLoaderData("layout-data-loader") as {
    userGroups: Group[];
    AIModels: AIModels[];
  };
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModels | null>(
    AIModels[0] ?? null
  );
  const { currentConversation, groupConversations, setGroupConversations } =
    useChat();

  // ✅ FIX 1: Local ref to track the active conversation, including newly
  // created ones that haven't propagated back through context yet.
  const activeConversationRef = useRef(currentConversation);

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [liveText, setLiveText] = useState("");
  const [streamPayload, setStreamPayload] = useState<ChatRequest>({
    conversationId: undefined,
    content: "",
    model: "",
  });
  const { t } = useTranslation();
  const shouldStartRef = useRef(false);

  const { text, streaming, done, start, abort } = useStream(
    sendPromptRequest.setPayload(streamPayload)
  );

  useEffect(() => {
    activeConversationRef.current = currentConversation;
    if (currentConversation) {
      setSelectedModel({ id: currentConversation.AIModel });
      setChatMessages(currentConversation.messages || []);
    }
  }, [currentConversation]);

  useEffect(() => {
    if (!streaming) return;
    const cleaned = text.replace(/\[DONE\]\s*$/g, "");
    setLiveText(cleaned);
  }, [text, streaming]);

  useEffect(() => {
    if (done) {
      const finalText = text.replace(/\[DONE\]\s*$/g, "").trim();
      if (!finalText) return;

      setChatMessages((prev) => [
        ...prev,
        { content: finalText, type: "response" } as Message,
      ]);
      setLiveText("");
    }
  }, [done, text]);

  useEffect(() => {
    const hasPayload =
      !!streamPayload.conversationId &&
      !!streamPayload.content &&
      !!streamPayload.model;

    if (hasPayload && shouldStartRef.current && !streaming) {
      shouldStartRef.current = false;
      start();
    }
  }, [
    streamPayload.conversationId,
    streamPayload.content,
    streamPayload.model,
    streaming,
    start,
  ]);

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedModel) return;

    const content = inputText;
    setInputText("");

    try {
      let conversation = activeConversationRef.current;

      if (!conversation) {
        const response = await createConversation(
          content,
          selectedModel.id,
          -1
        );
        if (response.data) {
          conversation = response.data;
          activeConversationRef.current = conversation;
          setGroupConversations([conversation, ...groupConversations]);
        }
      }

      if (!conversation?.id) return;

      setChatMessages((prev) => [
        ...prev,
        { content, type: "prompt", conversationId: conversation.id },
      ]);

      const payload: ChatRequest = {
        conversationId: conversation.id,
        content,
        model: conversation.AIModel,
      };

      setStreamPayload(payload);
      shouldStartRef.current = true;
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageText = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, i) => {
      if (line.startsWith("* ")) {
        return (
          <li key={i} className={styles.messageBullet}>
            {formatInline(line.substring(2))}
          </li>
        );
      }

      if (line.trim() === "") {
        return <br key={i} />;
      }

      return (
        <p key={i} className={styles.messageParagraph}>
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const isModelLocked =
    !!activeConversationRef.current ||
    chatMessages.length > 0;
    const messagesEndRef = useRef<HTMLDivElement>(null); 


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(()=>{
    scrollToBottom();
  },[])
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (streaming || liveText) {
      scrollToBottom();
    }
  }, [liveText, streaming]);

  return (
    <div className={styles.chatPage}>
      <header className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.logoDot} />
          <div>
            <h2 className={styles.chatTitle}>Agent Hub</h2>
            <p className={styles.chatSubtitle}>{t("chat.subtitle")}</p>
          </div>
        </div>

        <div className={styles.modelSelector}>
          <label>{t("chat.model")}</label>
          <select
            value={selectedModel?.id || ""}
            onChange={(e) => {
              const model =
                AIModels.find((m) => m.id === e.target.value) || null;
              setSelectedModel(model);
            }}
            className={styles.modelDropdown}
            // ✅ FIX 3: Lock the dropdown once any message exists, not just
            // when currentConversation is set (which lags behind on first send)
            disabled={isModelLocked}
          >
            {AIModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.chatMessages}>
        {/* ✅ FIX 4: Removed `currentConversation &&` guard — messages should
            display as soon as they exist, regardless of context state */}
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.messageRow} ${
              msg.type === "prompt" ? styles.userRow : styles.modelRow
            }`}
          >
            <div className={styles.messageBubble}>
              <div className={styles.messageSender}>
                {msg.type === "prompt" ? t("chat.you") : t("chat.aiResponse")}
              </div>

              <div className={styles.messageText}>
                {msg.type === "prompt"
                  ? msg.content
                  : formatMessageText(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {(streaming || liveText) && (
          <div className={styles.messageRow}>
            <div className={styles.messageBubble}>
              <div className={styles.messageSender}>
                {t("chat.aiResponse")}
              </div>
              <div className={styles.messageText}>
                {formatMessageText(liveText)}
              </div>
            </div>
          </div>
        )}
         <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInputWrapper}>
        <div className={styles.chatInputContainer}>
          <button className={styles.attachBtn}>+</button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.chatInput}
            placeholder={t("chat.promptPlaceholder")}
          />

          {streaming ? (
            <button className={styles.sendBtn} onClick={abort}>
              {t("common.stop")}
            </button>
          ) : (
            <button className={styles.sendBtn} onClick={sendMessage}>
              {t("common.send")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;