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
import { fileToBase64, type FileUpload } from "../api/messageApi";

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
  const [attachedFiles, setAttachedFiles] = useState<File|null>(null);

  const [activeConvId, setActiveConvId] = useState<number | undefined>(
    currentConversation?.id
  );
  const activeConversationRef = useRef(currentConversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatMessages = activeConvId ? (convMessagesMap.get(activeConvId) ?? []) : [];

  const { liveText, streaming, start, abort } = useSSEStream(activeConvId);

  const isModelLocked = !!activeConvId || chatMessages.length > 0;
  const apiUrl = import.meta.env.VITE_API_URL;
  useEffect(() => {
    activeConversationRef.current = currentConversation;
    if (currentConversation) {
      setSelectedModel({ id: currentConversation.AIModel });
      setActiveConvId(currentConversation.id);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
      if (files && files.length > 0) {
        setAttachedFiles(files[0]); // Chỉ lấy file đầu tiên
      }
      e.target.value = "";
  };

  const removeFile = () => {
    setAttachedFiles(null);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    if (file.type.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) return "📝";
    if (file.type.includes("sheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".csv")) return "📊";
    if (file.type.includes("text")) return "📃";
    return "📎";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedModel) return;

    const content = inputText;
    const fileToSend= attachedFiles;
    setInputText("");
    setAttachedFiles(null);
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
      const localFileUrl = fileToSend? URL.createObjectURL(fileToSend):undefined;

      appendMessage(convId, {
        content,
        type: "prompt",
        conversationId: convId,
        createdAt: new Date().toISOString(),
        fileUrl:localFileUrl,
        fileName: fileToSend?.name,
        fileType:fileToSend?.type
      });
      let uploads: FileUpload[] | undefined = undefined;
      if(fileToSend){
        const base64Data = await fileToBase64(fileToSend);
        uploads=[{
          data:base64Data,
          fileName: fileToSend.name,
          mimeType: fileToSend.type
        }]
      }
      start({ conversationId: convId, content, model: conversation.AIModel, files: uploads});

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

  // SVG icons
  const ThumbsUpIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  );

  const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );

  const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );

  const StopIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  );

  const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );

  const XIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );

  const AIAvatar = () => (
    <div className={styles.aiAvatar}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <circle cx="15.5" cy="8.5" r="1.5"/>
        <path d="M9 15a3 3 0 0 0 6 0"/>
      </svg>
    </div>
  );

  return (
    <div className={styles.chatPage}>
      {/* Header */}
      <header className={styles.chatHeader}>
        <h2 className={styles.chatTitle}>Agent Hub</h2>
        <div className={styles.modelSelector}>
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
          <span className={styles.modelDropdownChevron}>▾</span>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.chatMessages}>
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.messageRow} ${msg.type === "prompt" ? styles.userRow : styles.modelRow}`}
          >
            {msg.type !== "prompt" && <AIAvatar />}
            <div className={styles.messageBubbleWrapper}>
              <div className={styles.messageBubble}>
                {msg.fileUrl && (
                  <div className={styles.messageAttachmentsWrapper} style={{ marginBottom: msg.content ? '8px' : '0' }}>
                    {msg.fileType?.startsWith("image/") ? (
                      <div className={styles.chatImagePreview}>
                        <img 
                          src={`${apiUrl}/${msg.fileUrl}`} 
                          alt={msg.fileName || "image"} 
                          style={{ maxWidth: "240px", maxHeight: "180px", borderRadius: "8px", cursor: "pointer", display: "block" }}
                          onClick={() => window.open(msg.fileUrl, "_blank")}
                        />
                      </div>
                    ) : (
                      <a 
                        href={`${apiUrl}${msg.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        download={msg.fileName}
                        style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "inherit" }}
                      >
                        <span>📎</span> 
                        <span style={{ textDecoration: "underline" }}>{msg.fileName || "Xem file đính kèm"}</span>
                      </a>
                    )}
                  </div>
                )}
                <div className={styles.messageText}>
                  {msg.type === "prompt" ? msg.content : formatMessageText(msg.content)}
                </div>
              </div>

              {msg.type === "prompt" && msg.createdAt && (
                <div className={styles.messageMeta}>
                  <span className={styles.messageTime}>{formatMessageTime(msg.createdAt)}</span>
                </div>
              )}

              {msg.type !== "prompt" && (
                <div className={styles.modelMeta}>
                  <span className={styles.modelMetaName}>{selectedModel?.id?.toUpperCase()}</span>
                  <span className={styles.modelMetaDot}>•</span>
                  <span className={styles.modelMetaTime}>
                    {msg.createdAt ? formatMessageTime(msg.createdAt) : ""}
                  </span>
                  <div className={styles.modelActions}>
                    <button className={styles.actionBtn} title={t("common.like")}><ThumbsUpIcon /></button>
                    <button className={styles.actionBtn} title={t("common.copy")} onClick={() => navigator.clipboard?.writeText(msg.content)}><CopyIcon /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {(streaming || liveText) && (
          <div className={`${styles.messageRow} ${styles.modelRow}`}>
            <AIAvatar />
            <div className={styles.messageBubbleWrapper}>
              <div className={styles.messageBubble}>
                <div className={styles.messageText}>{formatMessageText(liveText)}</div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.chatInputWrapper}>
        {/* File chips shown above the input bar */}
        {attachedFiles && (
          <div className={styles.fileChipsRow}>
            <div className={styles.fileChip}>
              <span className={styles.fileChipIcon}>{getFileIcon(attachedFiles)}</span>
              <div className={styles.fileChipInfo}>
                <span className={styles.fileChipName}>{attachedFiles.name}</span>
                <span className={styles.fileChipSize}>{formatFileSize(attachedFiles.size)}</span>
              </div>
              <button
                className={styles.fileChipRemove}
                onClick={removeFile}
                title="Remove file"
              >
                <XIcon />
              </button>
            </div>
          </div>
        )}

        <div className={styles.chatInputContainer}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
          />
          {/* Plus / attach button */}
          <button
            className={styles.attachBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
          >
            <PlusIcon />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.chatInput}
            placeholder={t("chat.promptPlaceholder")}
          />

          {streaming
            ? <button className={styles.sendBtn} onClick={abort}><StopIcon /></button>
            : <button className={styles.sendBtn} onClick={sendMessage}><SendIcon /></button>
          }
        </div>
        <p className={styles.disclaimer}>Neural Hub may display inaccurate info, so double-check its responses.</p>
      </div>
    </div>
  );
};

export default ChatPage;
