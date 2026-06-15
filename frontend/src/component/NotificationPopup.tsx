import { useTranslation } from "react-i18next";
import styles from "../styles/layout.module.css";

interface ErrorPopupProps {
  error: boolean;
  info: boolean;
  errorMessage: string;
  infoMessage: string;
  onClose: () => void;
}

const NotificationPopup = ({ error, info, errorMessage, infoMessage, onClose }: ErrorPopupProps) => {
  if (!error && !info) {
    return null;
  }
  const { t } = useTranslation();
  const isError = error;
  const title = isError ? t("common.error") : t("common.information");
  const badge = isError ? t("common.error") : t("common.information");
  const message = isError ? errorMessage : infoMessage;

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
            aria-label="Close error popup"
          >
            ×
          </button>
        </div>

        <p className={styles["error-popup-message"]}>{message || (isError ? "An unexpected error occurred." : "Here is some information.")}</p>

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
