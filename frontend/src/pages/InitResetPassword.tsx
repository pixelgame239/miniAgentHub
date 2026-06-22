// pages/InitResetPassword.tsx
import { useEffect, useState } from "react";
import styles from "../styles/initResetPassword.module.css";
import { changePassword } from "../api/authApi";
import { useAuth } from "../hooks/authHook";
import { useTranslation } from "react-i18next";
import { setToken } from "../api/apiClient";
import { useNotificationPopup } from "../context/NotificationPopupContext";

const InitResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { user, setUser } = useAuth();
  const { showToast, showError } = useNotificationPopup();
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "light");
  },[]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const validate = () => {
    const newErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!password) {
      newErrors.password = t("password.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("password.passwordMin");
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t("password.confirmRequired");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("password.passwordMismatch")
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    const {data, error} = await changePassword({ newPassword: password });
    showToast(t("password.successChange"), "success");
    setUser({...user, active: true});
    if(data){
      console.log("Token setted");
      setToken(data);
    }
    if(error){
      showError(t("password.errorChange"));
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.resetPage}>
      <div className={styles.backgroundGlow} />

      <div className={styles.resetCard}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h1>{t("password.resetPassword")}</h1>

          <p>
            {t("password.description")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <div className={styles.formGroup}>
            <label>{t("password.newPassword")}</label>

            <input
              type="password"
              placeholder={t("password.newPassword")}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className={
                errors.password ? styles.inputError : ""
              }
              required
            />

            {errors.password && (
              <span className={styles.errorText}>
                {errors.password}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>{t("password.confirmPassword")}</label>

            <input
              type="password"
              placeholder={t("password.confirmPassword")}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className={
                errors.confirmPassword
                  ? styles.inputError
                  : ""
              }
              required
            />

            {errors.confirmPassword && (
              <span className={styles.errorText}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? t("common.loading")
              : t("password.updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitResetPassword;