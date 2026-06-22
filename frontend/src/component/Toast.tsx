// components/Toast.tsx
import React, { useEffect } from "react";
import styles from "../styles/toast.module.css";

interface ToastProps {
  isOpen: boolean;
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ isOpen, message, type, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500); // Tự động đóng sau 2.5 giây cho vừa tầm đọc

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles["toast-container"]}>
      <div className={`${styles["toast"]} ${type === "error" ? styles["toast-error"] : styles["toast-success"]}`}>
        
        {/* Khối hiệu dạng Icon */}
        <div className={styles["toast-icon"]}>
          {type === "error" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        
        {/* Message */}
        <div className={styles["toast-content"]}>
          <p className={styles["toast-message"]}>{message}</p>
        </div>

        {/* Nút Close nhanh */}
        <button className={styles["toast-close"]} onClick={onClose} aria-label="Close notification">
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;