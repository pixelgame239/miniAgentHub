// components/UpdatePasswordModal.tsx
import React, { useEffect, useState } from "react";
import styles from "../styles/modal.module.css"; // Changed to CSS Module
import { useTranslation } from "react-i18next";

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { t } = useTranslation();
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = t("password.passwordRequired");
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = t("password.passwordRequired");
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t("password.passwordMin");
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t("password.confirmRequired");
    } else if (confirmPassword.length < 6) {
      newErrors.confirmPassword = t("password.passwordMin");
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t("password.passwordMismatch");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit?.({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    onClose();

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["password-modal"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <div>
            <p className={styles["modal-eyebrow"]}>{t("password.security")}</p>
            <h2 className={styles["modal-title"]}>{t("password.updatePassword")}</h2>
          </div>

          <button className={styles["modal-close"]} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles["modal-form"]}>
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>{t("password.currentPassword")}</label>

            <input
              type="password"
              className={`${styles["form-input"]} ${
                errors.currentPassword ? styles["error"] : ""
              }`}
              placeholder={t("password.currentPassword")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            {errors.currentPassword && (
              <span className={styles["form-error"]}>{errors.currentPassword}</span>
            )}
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>{t("password.newPassword")}</label>

            <input
              type="password"
              className={`${styles["form-input"]} ${
                errors.newPassword ? styles["error"] : ""
              }`}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {errors.newPassword && (
              <span className={styles["form-error"]}>{errors.newPassword}</span>
            )}
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>{t("password.confirmPassword")}</label>

            <input
              type="password"
              className={`${styles["form-input"]} ${
                errors.confirmPassword ? styles["error"] : ""
              }`}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {errors.confirmPassword && (
              <span className={styles["form-error"]}>{errors.confirmPassword}</span>
            )}
          </div>

          <div className={styles["modal-actions"]}>
            <button type="button" className={styles["secondary-btn"]} onClick={onClose}>
              {t("common.cancel")}
            </button>

            <button type="submit" className={styles["primary-btn"]}>
              {t("password.updatePassword")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordModal;