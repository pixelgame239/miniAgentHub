import { useTranslation } from "react-i18next";
import styles from "../styles/layout.module.css";

// 1. Thay đổi interface nhận prop tinh gọn, linh hoạt hơn giống như Toast
interface NotificationPopupProps {
  isOpen: boolean;
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const NotificationPopup = ({ isOpen, message, type, onClose }: NotificationPopupProps) => {
  // 2. Kiểm tra trạng thái đóng mở ngay từ đầu
  if (!isOpen) {
    return null;
  }

  const { t } = useTranslation();
  
  // Xác định trạng thái dựa trên prop type truyền vào
  const isError = type === "error";
  
  const title = isError ? t("common.error") : t("common.information");
  const badge = isError ? t("common.error") : t("common.information");
  
  // Fallback text nếu message truyền vào bị rỗng
  const displayMessage = message || (isError ? "An unexpected error occurred." : "Here is some information.");

  return (
    <div className={styles["error-overlay"]} onClick={onClose} role="presentation">
      <div
        className={`${styles["error-popup"]} ${isError ? styles["error-popup--error"] : styles["error-popup--info"]}`}
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles["error-popup-header"]}>
          <div>
            <p className={styles["error-popup-badge"]}>{badge}</p>
            <h2 className={styles["error-popup-title"]}>{title}</h2>
          </div>
          <button
            type="button"
            className={styles["error-popup-close"]}
            onClick={onClose}
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        <p className={styles["error-popup-message"]}>{displayMessage}</p>

        <div className={styles["error-popup-actions"]}>
          <button type="button" className={styles["error-popup-button"]} onClick={onClose}>
            {isError ? t("common.dismiss") : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;