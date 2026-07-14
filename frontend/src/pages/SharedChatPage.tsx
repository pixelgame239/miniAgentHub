// pages/SharedChatPage.tsx
import { useEffect, useRef } from "react";
import { useNavigate, useLoaderData } from "react-router";
import { useTranslation } from "react-i18next";
// 📝 ĐỔI ĐƯỜNG DẪN IMPORT CSS TẠI ĐÂY:
import styles from "../styles/sharedChat.module.css"; 

interface Message {
  content: string;
  type: "prompt" | "model" | "response";
  createdAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

const SharedChatPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const snapShotData = useLoaderData() as any;

  let sharedData = null;
  if (snapShotData?.snapShotData) {
    try {
      sharedData = typeof snapShotData.snapShotData === "string" 
        ? JSON.parse(snapShotData.snapShotData) 
        : snapShotData.snapShotData;
    } catch (e) {
      console.error("Lỗi parse snapShotData:", e);
    }
  }

  const sharedTitle = sharedData?.title;
  const chatMessages: Message[] = (sharedData?.messages || []).map((msg: any) => ({
    ...msg,
    type: msg.type === "response" ? "model" : msg.type
  }));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "light");
    // Cuộn xuống cuối trang ở lần đầu load dữ liệu chat thành công
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            onClick={() => navigate("/chat")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "6px",
              borderRadius: "8px",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            title="Quay lại Chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h2 className={styles.chatTitle}
            style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
                lineHeight: "1.4"
              }}
            >{sharedTitle}</h2>
        </div>
        
        <span style={{
          fontSize: "12px",
          padding: "4px 10px",
          borderRadius: "20px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
          fontWeight: 500
        }}>
          {t("common.shared")}
        </span>
      </header>

      {/* Messages View */}
      {/* Bỏ thuộc tính style={{ paddingBottom: "60px" }} không cần thiết gây lệch layout */}
      <div className={styles.chatMessages}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dimmed)" }}>
            {t("chat.noData")}
          </div>
        ) : (
          chatMessages.map((msg, index) => (
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
                            src={msg.fileUrl.startsWith("blob:") ? msg.fileUrl : `${apiUrl}${msg.fileUrl}`} 
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

                <div className={msg.type === "prompt" ? styles.messageMeta : styles.modelMeta}>
                  {msg.type !== "prompt" && (
                    <>
                      <span className={styles.modelMetaName}>AI</span>
                      <span className={styles.modelMetaDot}>•</span>
                    </>
                  )}
                  <span className={styles.messageTime}>{formatMessageTime(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default SharedChatPage;