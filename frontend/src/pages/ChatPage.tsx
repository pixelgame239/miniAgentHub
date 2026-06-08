// ChatPage.tsx
import { useEffect, useRef, useState, type JSX } from "react";
import styles from "../styles/chat.module.css";
import { useRouteLoaderData } from "react-router";
import type { AIModels } from "../loader/aiLoader";
import { useChat } from "../hooks/chatHook";
import { createConversation } from "../api/conversationApi";
import type { Group } from "../loader/groupLoader";
import { useTranslation } from "react-i18next";
import { useSSEStream } from "../hooks/streamHook";

const ChatPage = () => {
  const { AIModels } = useRouteLoaderData("layout-data-loader") as {
    userGroups: Group[];
    AIModels: AIModels[];
  };

  const { t } = useTranslation();
  const {
    currentConversation, setCurrentConversation,
    groupConversations, setGroupConversations,
    convMessagesMap, initConvMessages, appendMessage,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModels | null>(AIModels[0] ?? null);

  // State (not just ref) so the component re-renders when the active tab changes
  const [activeConvId, setActiveConvId] = useState<number | undefined>(
    currentConversation?.id
  );
  const activeConversationRef = useRef(currentConversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read messages from context — reflects background stream updates across tab switches
  const chatMessages = activeConvId ? (convMessagesMap.get(activeConvId) ?? []) : [];

  const { liveText, streaming, start, abort } = useSSEStream(activeConvId);

  const isModelLocked = !!activeConvId || chatMessages.length > 0;

  useEffect(() => {
    activeConversationRef.current = currentConversation;
    if (currentConversation) {
      setSelectedModel({ id: currentConversation.AIModel });
      setActiveConvId(currentConversation.id);
      // initConvMessages is a no-op if the conversation is already in the map,
      // so background-streamed messages are never overwritten on tab switch
      initConvMessages(currentConversation.id, currentConversation.messages ?? []);
    } else {
      setActiveConvId(undefined);
    }
  }, [currentConversation, initConvMessages]);

  useEffect(() => {
    return () => setCurrentConversation(null);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, liveText]);

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedModel) return;

    const content = inputText;
    setInputText("");

    try {
      let conversation: any = activeConversationRef.current;

      if (!conversation) {
        const response = await createConversation(content, selectedModel.id);
        if (response.data) {
          conversation = response.data;
          activeConversationRef.current = conversation;
          setActiveConvId(conversation.id);
          setGroupConversations([conversation, ...groupConversations]);
          initConvMessages(conversation.id, []);
        }
      }

      if (!conversation?.id) return;
      const convId = conversation.id;

      // Append prompt into context so it survives tab switches too
      appendMessage(convId, {
        content,
        type: "prompt",
        conversationId: convId,
        createdAt: new Date().toISOString(),
      });

      // start() streams in the background; onDone writes the response into context
      start({ conversationId: convId, content, model: conversation.AIModel });

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

  const formatInline = (text: string) =>
    text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );

  const formatMessageText = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("* "))
        return <li key={i} className={styles.messageBullet}>{formatInline(line.substring(2))}</li>;
      if (line.trim() === "")
        return <br key={i} />;
      return <p key={i} className={styles.messageParagraph}>{formatInline(line)}</p>;
    });

  const formatMessageTime = (createdAt?: string | Date) => {
    if (!createdAt) return "";
    const ts = new Date(createdAt);
    if (isNaN(ts.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium", timeStyle: "short",
    }).format(ts);
  };

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
            onChange={(e) => setSelectedModel(AIModels.find(m => m.id === e.target.value) ?? null)}
            className={styles.modelDropdown}
            disabled={isModelLocked}
          >
            {AIModels.map(model => (
              <option key={model.id} value={model.id}>{model.id}</option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.chatMessages}>
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.messageRow} ${msg.type === "prompt" ? styles.userRow : styles.modelRow}`}
          >
            <div className={styles.messageBubble}>
              <div className={styles.messageSender}>
                {msg.type === "prompt" ? t("chat.you") : t("chat.aiResponse")}
              </div>
              <div className={styles.messageText}>
                {msg.type === "prompt" ? msg.content : formatMessageText(msg.content)}
              </div>
              {msg.createdAt && (
                <div className={styles.messageMeta}>
                  <span className={styles.messageTime}>{formatMessageTime(msg.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {(streaming || liveText) && (
          <div className={`${styles.messageRow} ${styles.modelRow}`}>
            <div className={styles.messageBubble}>
              <div className={styles.messageSender}>{t("chat.aiResponse")}</div>
              <div className={styles.messageText}>{formatMessageText(liveText)}</div>
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
          {streaming
            ? <button className={styles.sendBtn} onClick={abort}>{t("common.stop")}</button>
            : <button className={styles.sendBtn} onClick={sendMessage}>{t("common.send")}</button>
          }
        </div>
      </div>
    </div>
  );
};

export default ChatPage;