// ChatPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../styles/chat.module.css";
import { useRouteLoaderData } from "react-router";
import type { AIModels } from "../loader/aiLoader";
import { useChat } from "../hooks/chatHook";
import { createConversation, getConversationDetail } from "../api/conversationApi";
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
import ApiKeyModal from "../component/ApiKeyModal";
import StreamingBubble from "../component/StreamingBubble";
import { ChatActionButtons } from "../component/ChatActionButtons";
import SuccessLinkShared from "../component/SuccessLinkShared";
import ReusableDialog from "../component/ReusableDialogProps";

  const formatInline = (text: string) =>
    text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
    
const ChatPage = () => {
  const { showError, showInfo, showToast } = useNotificationPopup();
  const { t } = useTranslation();
  
  const {
    currentConversation, setCurrentConversation,
    groupConversations, setGroupConversations,
    convMessagesMap, initConvMessages, appendMessage, prependConvMessages,
  } = useChat();

  // Định nghĩa mảng providers cố định kèm danh sách model chính xác
    const providers = [
    { id: "flowise", name: "Flowise", icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/flowise.png", models: ["flowise"] },
    { id: "openRouter", name: "OpenRouter", icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/openrouter-icon.png", models: ["poolside/laguna-m.1:free", "google/gemma-4-26b-a4b-it:free"] },
    { id: "groq", name: "Groq", icon: "https://images.seeklogo.com/logo-png/60/1/groq-icon-logo-png_seeklogo-605779.png", models: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"] },
  ];

  // Khởi tạo state selectedModel bằng giá trị đầu tiên trong mảng models của provider đầu tiên ("flowise")
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState<{ id: string }>({ id: providers[0].models[0] });
  const [attachedFiles, setAttachedFiles] = useState<File|null>(null);
  // ChatPage.tsx
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [targetConfigModel, setTargetConfigModel] = useState<string | undefined>(undefined);
  const [activeConvId, setActiveConvId] = useState<number | undefined>(
    currentConversation?.id
  );
  const activeConversationRef = useRef(currentConversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatMessages = activeConvId ? (convMessagesMap.get(activeConvId) ?? []) : [];
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>("flowise");
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const chatMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [chatPage, setChatPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOldMessages, setIsLoadingOldMessages] = useState(false);
  const isInitialLoadRef = useRef(true);
  const isFetchingRef = useRef(false);
  useEffect(() => {
      setSelectedModel({ id: providers[0].models[0] });
  },[]);
  // Cập nhật hàm lấy icon động bằng cách duyệt qua mảng cấu hình providers cố định
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
      // setSelectedModel({ id: currentConversation.AIModel });
      setActiveConvId(currentConversation.id);
      initConvMessages(currentConversation.id, currentConversation.messages ?? []);
      setChatPage(0);
      setHasMoreMessages(currentConversation.totalPages !== undefined && currentConversation.totalPages > 1);
      isInitialLoadRef.current = true;
    } else {
      setActiveConvId(undefined);
    }
  }, [currentConversation, initConvMessages]);

  useEffect(() => {
    return () => setCurrentConversation(null);
  }, []);
  useEffect(() => {
    const container = chatMessagesContainerRef.current;
    if (!container) return;

    if (isInitialLoadRef.current && chatMessages.length > 0) {
      // Lần đầu tải cuộc trò chuyện: scroll thẳng xuống đáy ngay lập tức
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
    } else if (!isFetchingRef.current) {
      // Chỉ tự động scroll xuống đáy khi không phải hoạt động tải tin nhắn cũ
      // Sử dụng API scrollTo trực tiếp trên container để mượt mà hơn trên mọi trình duyệt
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatMessages, liveText]);
  // ---- XỬ LÝ SỰ KIỆN CUỘN LÊN ĐỂ TẢI TIN NHẮN CŨ (Đã tối ưu cho totalPages) ----
  const chatMessagesRef = useRef(chatMessages);
  const chatPageRef = useRef(chatPage);

  // Luôn đồng bộ mảng tin nhắn và số trang hiện tại vào Refs
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    chatPageRef.current = chatPage;
  }, [chatPage]);
// ---- XỬ LÝ SỰ KIỆN CUỘN LÊN ĐỂ TẢI TIN NHẮN CŨ (An toàn cho Stream & Abort) ----
  const handleChatScroll = async () => {
    const container = chatMessagesContainerRef.current;
    if (!container || isLoadingOldMessages || !hasMoreMessages || !activeConvId) return;

    if (container.scrollTop <= 15) {
      setIsLoadingOldMessages(true);
      isFetchingRef.current = true; // Khóa auto scroll-down

      const nextChatPage = chatPage + 1; // Sử dụng state chatPage bình thường
      const previousScrollHeight = container.scrollHeight;
      const previousScrollTop = container.scrollTop;

      const { data, error } = await getConversationDetail(activeConvId, nextChatPage);

      if (error) {
        console.error("Failed to load older messages:", error);
        setIsLoadingOldMessages(false);
        isFetchingRef.current = false;
        return;
      }

      const oldMessages = data?.messages || [];
      const totalPages = data?.totalPages || 1;

      if (oldMessages.length > 0) {
        // GỌI HÀM CHUYÊN BIỆT: Chèn tin nhắn cũ lên đầu một cách an toàn, tự lọc trùng lặp
        prependConvMessages(activeConvId, oldMessages);
        
        setChatPage(nextChatPage);

        if (nextChatPage >= totalPages - 1) {
          setHasMoreMessages(false);
        }
        
        // Neo giữ vị trí cuộn tránh giật màn hình
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = (newScrollHeight - previousScrollHeight) + previousScrollTop;
          
          setTimeout(() => {
            isFetchingRef.current = false;
          }, 100);
        });
      } else {
        setHasMoreMessages(false);
        isFetchingRef.current = false;
      }
      setIsLoadingOldMessages(false);
    }
  };

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
        setShareLink(window.location.origin + data);
        setShareSuccess(true);
      } else if (error) {
      showError(t("common.failed"));
      }
    }
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sendMessage = async () => {
    if (streaming ||!inputText.trim() || !selectedModel) return;

    const content = inputText;
    const fileToSend= attachedFiles;
    setInputText("");
    setAttachedFiles(null);
    try {
      let conversation: any = activeConversationRef.current;

      if (!conversation) {
        const {data, error} = await createConversation(content);
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
          // finalData = await optimizeBase64Image(base64Data, 600, 0.6);
          finalMime = "image/jpeg";
          finalName = fileToSend.name.replace(/\.[^/.]+$/, "") + ".jpg";
        }
        uploads=[{
          data:finalData,
          fileName: finalName,
          mimeType: finalMime
        }]
      }
      start({ conversationId: convId, content, model: selectedModel.id, files: uploads},
        (status, msg) => {
          if (status === 400) {
            showError(t("chat.wrongConfiguration"));
          } else if(status === 500) {
            showError(t("common.InternalError"));
          }
        }
      );

    } catch (err) {
      showError(t("common.failed"));
      console.error(err);
    }
  };

  const handleSendClick = useCallback(async () => {
    await sendMessage();
    const textarea = document.querySelector(`.${styles.chatInput}`) as HTMLTextAreaElement;
    if (textarea) textarea.style.height = "auto";
  }, [sendMessage]);

  const canSend = inputText.trim().length > 0;

    const formatMessageText = useCallback((text: string) => {
      return formatInline(text);
    }, []);

  const formatMessageTime = (createdAt?: string | Date) => {
    if (!createdAt) return "";
    const ts = new Date(createdAt);
    if (isNaN(ts.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium", timeStyle: "short",
    }).format(ts);
  };
  
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
              <img src={providers.find((p) => p.models.includes(selectedModel?.id))?.icon} alt="Selected Model Icon" className={styles.providerImgIcon} />
            </span>
            <span className={styles.modelNameText}>
              {selectedModel.id}
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
                        setTargetConfigModel(provider.models[0]); 
                        setIsApiKeyModalOpen(true); // Bật Modal Overlay lên
                        setIsModelDropdownOpen(false); // Đóng menu dropdown lựa chọn lại
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
      <div className={styles.chatMessages} ref={chatMessagesContainerRef} onScroll={handleChatScroll}>
        {isLoadingOldMessages && (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '13px', color: '#888' }}>
            {t("common.loading")}
          </div>
        )}
        {chatMessages.map((msg, index) => (
          <div
            key={msg.id ? `msg-${msg.id}` : `idx-${index}`}
            className={`${styles.messageRow} ${msg.type === "prompt" ? styles.userRow : styles.modelRow}`}
          >
            {/* {msg.type !== "prompt" && <AIAvatar />} */}
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
                        <span style={{ textDecoration: "underline" }}>{msg.fileName}</span>
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
                  <span className={styles.modelMetaName}>{msg.AIModel}</span>
                  <span className={styles.modelMetaDot}>•</span>
                  <span className={styles.modelMetaTime}>
                    {msg.createdAt ? formatMessageTime(msg.createdAt) : ""}
                  </span>
                  {!msg.isCompleted && <span className={styles.abortChatStatus}>{t("chat.abortChat")}</span>}
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
          <StreamingBubble streaming={streaming} liveText={liveText} formatMessageText={formatMessageText} />
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

          <textarea
            value={inputText}
            rows={1}
            onChange={(e) => {
              setInputText(e.target.value);
              // Tự động tính toán độ cao chính xác theo nội dung gõ vào
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (inputText.trim() && !streaming) {
                  sendMessage();
                  // RESET CHIỀU CAO: Thu về 1 dòng sau khi bấm Enter gửi bài
                  e.currentTarget.style.height = "auto";
                }
              }
            }}
            className={styles.chatInput}
            placeholder={t("chat.promptPlaceholder")}
            disabled={streaming}
            // Thêm mẹo nhỏ này để textarea render mượt mà ngay từ dòng đầu tiên
            style={{ height: "auto" }} 
          />
        <ChatActionButtons 
          streaming={streaming}
          onAbort={abort}        // Hàm abort từ hook của bạn đã tối ưu useCallback
          onSend={handleSendClick} // Hàm đã bọc useCallback ở trên
          canSend={canSend}      // Biến primitive (boolean), cực kỳ an toàn khi React.memo so sánh
        />
        </div>
        <p className={styles.disclaimer}>Neural Hub may display inaccurate info, so double-check its responses.</p>
      </div>
        <ExportModal 
          isOpen={isExportOpen} 
          onClose={() => setIsExportOpen(false)} 
          onExport={async (format: "docx" | "pdf") => await handleExportMessage(format)}
        />
        <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        provider={providers.find(p => p.models.includes(targetConfigModel || ""))?.id || "flowise"}
      />
      <ReusableDialog
        open={shareSuccess}
        title={t("chat.shareMessageTitle")}
        onClose={() => setShareSuccess(false)}
        footer={
          <button 
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-subtle)",
              color: "var(--text-primary)",
              cursor: "pointer"
            }}
            onClick={() => setShareSuccess(false)}
          >
            {t("common.close") || "Đóng"}
          </button>
        }
      >
        <SuccessLinkShared linkToCopy={shareLink} />
      </ReusableDialog>
    </div>
  );
};


export default ChatPage;