// components/UpdatePasswordModal.tsx
import React, { useEffect, useState } from "react";
import styles from "../styles/modal.module.css"; 
import { useTranslation } from "react-i18next";

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: string; // Nhận lỗi từ API (ví dụ: "Mật khẩu hiện tại không đúng")
  onSubmit?: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  isOpen,
  onClose,
  error,
  onSubmit,
}) => {
  const { t } = useTranslation();

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error states
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Đánh dấu xem người dùng đã chạm/gõ vào ô đó chưa (tránh báo lỗi ngay khi vừa mở modal)
  const [touched, setTouched] = useState<{
    currentPassword?: boolean;
    newPassword?: boolean;
    confirmPassword?: boolean;
  }>({});

  // 1. Lắng nghe lỗi từ Backend/API gửi xuống
  useEffect(() => {
    if (error) {
      setErrors((prev) => ({
        ...prev,
        currentPassword: error,
      }));
    }
  }, [error]);

  // 2. Real-time Validation: Chạy validate mỗi khi input thay đổi
  useEffect(() => {
    const newErrors: typeof errors = {};

    // Validate Mật khẩu hiện tại (chỉ validate client-side nếu đã bị touched)
    if (touched.currentPassword && !currentPassword.trim()) {
      newErrors.currentPassword = t("password.passwordRequired");
    } else if (error && !touched.currentPassword) {
      // Giữ lại lỗi từ API nếu người dùng chưa sửa ô này
      newErrors.currentPassword = error;
    }

    // Validate Mật khẩu mới
    if (touched.newPassword) {
      if (!newPassword.trim()) {
        newErrors.newPassword = t("password.passwordRequired");
      } else if (newPassword.length < 6) {
        newErrors.newPassword = t("password.passwordMin");
      }
    }

    // Validate Xác nhận mật khẩu mới
    if (touched.confirmPassword) {
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = t("password.confirmRequired");
      } else if (confirmPassword.length < 6) {
        newErrors.confirmPassword = t("password.passwordMin");
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = t("password.passwordMismatch");
      }
    }

    setErrors(newErrors);
  }, [currentPassword, newPassword, confirmPassword, touched, error, t]);

  // Reset form khi đóng/mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setTouched({});
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Hàm helper kích hoạt validate toàn bộ (dùng khi bấm submit)
  const validateAllFields = () => {
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    // Kiểm tra nhanh xem form hiện tại đã hợp lệ chưa
    const hasError = 
      !currentPassword.trim() || 
      !newPassword.trim() || newPassword.length < 6 ||
      !confirmPassword.trim() || confirmPassword.length < 6 || newPassword !== confirmPassword;
    
    return !hasError;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Nếu kích hoạt tất cả các ô mà vẫn có lỗi thì dừng lại
    if (!validateAllFields()) return;

    onSubmit?.({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["password-modal"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <div>
            <p className={styles["modal-eyebrow"]}>{t("password.security")}</p>
            <h2 className={styles["modal-title"]}>{t("password.updatePassword")}</h2>
          </div>
          <button className={styles["modal-close"]} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles["modal-form"]}>
          
          {/* Ô MẬT KHẨU HIỆN TẠI */}
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>{t("password.currentPassword")}</label>
            <input
              type="password"
              className={`${styles["form-input"]} ${errors.currentPassword ? styles["error"] : ""}`}
              placeholder={t("password.currentPassword")}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setTouched((prev) => ({ ...prev, currentPassword: true }));
              }}
            />
            {errors.currentPassword && (
              <span className={styles["form-error"]}>{errors.currentPassword}</span>
            )}
          </div>

          {/* Ô MẬT KHẨU MỚI */}
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>{t("password.newPassword")}</label>
            <input
              type="password"
              className={`${styles["form-input"]} ${errors.newPassword ? styles["error"] : ""}`}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setTouched((prev) => ({ ...prev, newPassword: true }));
              }}
            />
            {errors.newPassword && (
              <span className={styles["form-error"]}>{errors.newPassword}</span>
            )}
          </div>

          {/* Ô XÁC NHẬN MẬT KHẨU */}
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>{t("password.confirmPassword")}</label>
            <input
              type="password"
              className={`${styles["form-input"]} ${errors.confirmPassword ? styles["error"] : ""}`}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setTouched((prev) => ({ ...prev, confirmPassword: true }));
              }}
            />
            {errors.confirmPassword && (
              <span className={styles["form-error"]}>{errors.confirmPassword}</span>
            )}
          </div>

          <div className={styles["modal-actions"]}>
            <button type="button" className={styles["secondary-btn"]} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className={styles["primary-btn"]} disabled={Object.keys(errors).length > 0 || !currentPassword.trim() || !newPassword.trim() || newPassword.length < 6 || !confirmPassword.trim() || confirmPassword.length < 6 || newPassword !== confirmPassword}>
              {t("password.updatePassword")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordModal;