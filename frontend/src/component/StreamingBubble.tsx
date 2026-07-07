import React, { type JSX } from 'react';
import styles from '../styles/chat.module.css'; // Sửa lại đường dẫn style của bạn

interface StreamingBubbleProps {
  streaming: boolean;
  liveText: string;
  formatMessageText: (text: string) => (string | JSX.Element)[];
}
// Định nghĩa Props mà component này cần nhận
const StreamingBubble = React.memo<StreamingBubbleProps>(({ streaming, liveText, formatMessageText }) => {
  // Nếu không streaming thì không hiển thị gì cả
  if (!streaming) return null;

  return (
    <div className={`${styles.messageRow} ${styles.modelRow}`}>
      {/* <AIAvatar /> */}
      <div className={styles.messageBubbleWrapper}>
        <div className={`${styles.messageBubble} ${liveText.trim() === "" ? styles.loadingBubble : ""}`}>
          <div className={styles.messageText}>
            {liveText.trim() !== "" 
              ? formatMessageText(liveText)
              : (
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
});

// Đặt tên hiển thị trong React DevTools (Tùy chọn nhưng nên có)
StreamingBubble.displayName = 'StreamingBubble';

export default StreamingBubble;