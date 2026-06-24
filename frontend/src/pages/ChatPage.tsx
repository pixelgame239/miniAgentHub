// ChatPage.tsx
import { useEffect, useRef, useState } from "react";
import styles from "../styles/chat.module.css";
import { useRouteLoaderData } from "react-router";
import type { AIModels } from "../loader/aiLoader";
import { useChat } from "../hooks/chatHook";
import { createConversation } from "../api/conversationApi";
import type { Group } from "../loader/groupLoader";
import { useTranslation } from "react-i18next";
import { useSSEStream } from "../hooks/streamHook";
import { fileToBase64, type FileUpload } from "../api/messageApi";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import { shareMessage } from "../api/shareApi";
import { exportMessage } from "../api/exportApi";
import { generateDocx, generatePdf} from "../utils/export";
import ExportModal from "../component/ExportModal";
import { SettingsIcon } from "./GroupsPage";

const ChatPage = () => {
  const { showError, showInfo, showToast } = useNotificationPopup();
  const { t } = useTranslation();
  
  const {
    currentConversation, setCurrentConversation,
    groupConversations, setGroupConversations,
    convMessagesMap, initConvMessages, appendMessage,
  } = useChat();

  // Định nghĩa mảng providers cố định kèm danh sách model chính xác
  const providers = [
    { id: "flowise", name: "Flowise", icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/flowise.png", models: ["flowise-default", "flowise-custom"] },
    { id: "deepseek", name: "DeepSeek", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Deepseek-logo-icon.svg/960px-Deepseek-logo-icon.svg.png", models: ["deepseek-v4-flash", "deepseek-v4-pro"] },
    { id: "groq", name: "Groq", icon: "https://images.seeklogo.com/logo-png/60/1/groq-icon-logo-png_seeklogo-605779.png", models: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "groq/compound"] },
  ];

  // Khởi tạo state selectedModel bằng giá trị đầu tiên trong mảng models của provider đầu tiên ("flowise")
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState<{ id: string } | null>({ id: providers[0].models[0] });
  const [attachedFiles, setAttachedFiles] = useState<File|null>(null);

  const [activeConvId, setActiveConvId] = useState<number | undefined>(
    currentConversation?.id
  );
  const activeConversationRef = useRef(currentConversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatMessages = activeConvId ? (convMessagesMap.get(activeConvId) ?? []) : [];
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>("flowise");

  // Cập nhật hàm lấy icon động bằng cách duyệt qua mảng cấu hình providers cố định
  const getActiveModelIcon = () => {
    if (!selectedModel) return "🤖";
    const matchedProvider = providers.find(p => p.models.includes(selectedModel.id));
    return matchedProvider ? matchedProvider.icon : "🤖";
  };

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportID, setExportID] = useState<number | null>(null);
  const handleOpenExport = (messageId: number) => {
    setExportID(messageId);
    setIsExportOpen(true);
  };
  const handleExportMessage = async(format: "docx" | "pdf") => {
    if(exportID === null) return;
    const { data, error } = await exportMessage(exportID);
    if (data) {
      if(format === "docx"){
        await generateDocx(data);
      } else if(format === "pdf"){
        await generatePdf(data);
      }
      showToast(t("common.success"), "success");
    }
    if (error) {
      showError(t("common.failed"));
    }
    setIsExportOpen(false);
  }

  const { liveText, streaming, start, abort } = useSSEStream(activeConvId);
  const apiUrl = import.meta.env.VITE_API_URL;
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "dark");
  }, []);

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
        setAttachedFiles(files[0]);
      }
      e.target.value = "";
  };

  const removeFile = () => {
    setAttachedFiles(null);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return "🖼️";
    return "📎";
  };
  const handleShareMessage = async(messageId: number) =>{
      const { data, error } = await shareMessage(messageId);
      if (data) {
        showInfo(t("common.success") + ":" + window.location.origin + data);
      } else if (error) {
      showError(t("common.failed"));
      }
    }
  async function optimizeBase64Image(base64Str: string, maxEdge: number = 1024, quality: number = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxEdge) {
                    height = Math.round((height * maxEdge) / width);
                    width = maxEdge;
                }
            } else {
                if (height > maxEdge) {
                    width = Math.round((width * maxEdge) / height);
                    height = maxEdge;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Failed to acquire a 2D Canvas Context pipeline.'));
            }

            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };

        img.onerror = (error) => reject(error);
    });
}

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
        const {data, error} = await createConversation(content, selectedModel.id);
        if (data) {
          setCurrentConversation(data);
          conversation = data;
          activeConversationRef.current = conversation;
          setActiveConvId(conversation.id);
          setGroupConversations([conversation, ...groupConversations]);
          initConvMessages(conversation.id, []);
        }
        if (error) {
          showError(t("common.failed"+":"+error.message));
          console.error("Failed to create conversation:", error);
          return;
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
        let finalData = base64Data;
        let finalMime = fileToSend.type;
        let finalName = fileToSend.name;
        if(fileToSend.type.startsWith("image/")){
          finalData = await optimizeBase64Image(base64Data, 600, 0.6);
          finalMime = "image/jpeg";
          finalName = fileToSend.name.replace(/\.[^/.]+$/, "") + ".jpg";
        }
        uploads=[{
          data:finalData,
          fileName: finalName,
          mimeType: finalMime
        }]
      }
      if(!localStorage.getItem("APIKey")){
        showError(t("common.noAPIKey"));
        return;
      }
      start({ conversationId: convId, content, model: conversation.AIModel, APIKey: localStorage.getItem("APIKey"), files: uploads});

    } catch (err) {
      showError(t("common.failed"));
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
  
  const ExportIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
  const ShareIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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
        <div className={styles.modelSelectorWrapper}>
          {/* Nút trigger chính */}
          <div 
            className={styles.customDropdownTrigger}
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          >
            <span className={styles.modelIcon}>
              {getActiveModelIcon()?.startsWith("http") ? (
                <img src={getActiveModelIcon()} alt="Selected Model Icon" className={styles.providerImgIcon} />
              ) : (
                <span className={styles.defaultRobotIcon}>{getActiveModelIcon()}</span>
              )}
            </span>
            <span className={styles.modelNameText}>
              {selectedModel?.id || "Chọn Model"}
            </span>
            <span className={styles.modelDropdownChevron}>▾</span>
          </div>

          {/* Menu Dropdown Phân Cấp từ danh sách fix cứng */}
          {isModelDropdownOpen && (
            <div 
              className={styles.customDropdownMenu}
              onMouseLeave={() => setActiveProvider(null)} 
            >
              {providers.map((provider) => {
                return (
                  <div 
                    key={provider.id} 
                    className={`${styles.providerItemRow} ${activeProvider === provider.id ? styles.providerRowHovered : ""}`}
                    onMouseEnter={() => setActiveProvider(provider.id)}
                  >
                    {/* Phần thông tin Provider (bên trái) */}
                    <div className={styles.providerInfoWrapper}>
                      <div className={styles.providerInfo}>
                        <img src={provider.icon} alt={provider.name} className={styles.providerImgIcon} />
                        <span className={styles.providerName}>{provider.name}</span>
                      </div>
                    </div>
                    {/* Nút răng cưa riêng cho từng AI Provider */}
                    <button 
                      className={styles.providerSettingsBtn}
                      title={`Cấu hình ${provider.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Mở cài đặt riêng cho: ${provider.name}`);
                      }}
                    >
                      <SettingsIcon />
                    </button>

                    {/* Menu con lấy trực tiếp từ provider.models */}
                    {activeProvider === provider.id && provider.models.length > 0 && (
                      <div className={styles.subModelMenuLeft}>
                        {provider.models.map((modelName) => (
                          <div 
                            key={modelName} 
                            className={`${styles.subModelItem} ${selectedModel?.id === modelName ? styles.activeSubModel : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModel({ id: modelName });
                              setIsModelDropdownOpen(false);
                            }}
                          >
                            {modelName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                          src={msg.fileUrl.startsWith("blob:")?msg.fileUrl: `${apiUrl}${msg.fileUrl}`} 
                          alt={msg.fileName || "image"} 
                          style={{ maxWidth: "240px", maxHeight: "180px", borderRadius: "8px", cursor: "pointer", display: "block" }}
                          onClick={() => {
                            if(msg.fileUrl&&msg.fileUrl.startsWith("blob:")){
                              window.open(msg.fileUrl, "_blank");
                            } else {
                              window.open(`${apiUrl}${msg.fileUrl}`, "_blank");
                            }
                          }}
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
                    <button className={styles.actionBtn} title={t("common.copy")} onClick={() => navigator.clipboard?.writeText(msg.content)}><CopyIcon /></button>
                    <button className={styles.actionBtn} title={t("common.share")} onClick={async() => await handleShareMessage(msg.id as number)}><ShareIcon /></button>
                    <button className={styles.actionBtn} title={t("common.export")} onClick={() => handleOpenExport(msg.id as number)}><ExportIcon /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {streaming && (
          <div className={`${styles.messageRow} ${styles.modelRow}`}>
            <AIAvatar />
            <div className={styles.messageBubbleWrapper}>
              <div className={styles.messageBubble}>
                <div className={styles.messageText}>
                  {liveText
                    ? formatMessageText(liveText)
                    : <span>●</span>
                  }
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.chatInputWrapper}>
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
          />
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
        <ExportModal 
          isOpen={isExportOpen} 
          onClose={() => setIsExportOpen(false)} 
          onExport={async (format: "docx" | "pdf") => await handleExportMessage(format)}
        />
    </div>
  );
};

export default ChatPage;