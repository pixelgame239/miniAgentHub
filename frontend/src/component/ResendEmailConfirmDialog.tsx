import React from "react";
import styles from "../styles/user.module.css";
import { useTranslation } from "react-i18next";
import type { User } from "../loader/userLoader";

interface ResendEmailConfirmDialogProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean; // <-- Nhận thêm trạng thái đang gửi từ cha
}

const ResendEmailConfirmDialog: React.FC<ResendEmailConfirmDialogProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
  submitting,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !user) return null;

  return (
    <div 
      className={styles.dialogOverlay} 
      onClick={submitting ? undefined : onClose} // Vô hiệu hóa click ra ngoài khi đang gửi
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <h2>{t("users.resendEmailTitle", "Gửi lại email xác thực")}</h2>
          <button 
            className={styles.dialogCloseBtn} 
            onClick={onClose}
            disabled={submitting} // Vô hiệu hóa nút X
          >
            ×
          </button>
        </div>

        <div className={styles.dialogBody}>
          <p className={styles.dialogText}>
            {t("users.resendEmailConfirmation", "Bạn có chắc chắn muốn gửi lại email xác thực cho")} {" "}
            <strong>{user.fullname}</strong> ({user.email})?
          </p>
        </div>

        <div className={styles.dialogFooter}>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose}
            disabled={submitting} // Vô hiệu hóa nút Hủy
          >
            {t("common.cancel")}
          </button>
          
          <button
            className={styles.confirmDeleteBtn}
            style={{ 
              backgroundColor: submitting ? "#ccc" : "var(--primary-color, #007bff)",
              cursor: submitting ? "not-allowed" : "pointer"
            }}
            onClick={onConfirm}
            disabled={submitting} // Vô hiệu hóa nút Xác nhận
          >
            {submitting 
              ? t("common.sending", "Đang gửi...") 
              : t("common.confirm", "Xác nhận")
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResendEmailConfirmDialog;