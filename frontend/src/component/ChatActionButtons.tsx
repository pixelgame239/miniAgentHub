import React from "react";
import styles from "../styles/chat.module.css";

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

interface ChatActionButtonsProps {
    streaming: boolean;
    onAbort: () => void;
    onSend: () => void;
    canSend: boolean; // Thay vì truyền cả chuỗi inputText, ta chỉ truyền 1 biến boolean true/false
}

// Dùng React.memo để ép React CHỈ render lại khi các prop này thực sự thay đổi giá trị
export const ChatActionButtons = React.memo(({ 
    streaming, 
    onAbort, 
    onSend,
    canSend
}: ChatActionButtonsProps) => {
    
    // Log này bây giờ sẽ CHỈ CHẠY ĐÚNG 2 LẦN: 1 lần chuyển sang nút Stop, và 1 lần chuyển lại nút Send
    console.log("[ChatActionButtons] Rerendered");

    if (streaming) {
    return (
        <button type="button" className={styles.sendBtn} onClick={onAbort}>
        <StopIcon />
        </button>
    );
    }

    return (
    <button 
        type="button"
        className={styles.sendBtn} 
        onClick={onSend}
        disabled={!canSend}
    >
        <SendIcon />
    </button>
    );
});