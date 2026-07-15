// pages/ResetPasswordPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router"; 
import styles from "../styles/initResetPassword.module.css";
import { useTranslation } from "react-i18next";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import { resetPassword, verifyResetPasswordToken } from "../api/authApi";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast, showError } = useNotificationPopup();

  // Lấy email và token từ URL
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Đồng bộ theme
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      localStorage.getItem("app-theme") || "dark"
    );
    const verifyToken = async () => {
      if (!token || !email) return;
      try {
        const { data, error } = await verifyResetPasswordToken(email, token);
        if (error) {
          showError(t("password.invalidLinkDesc"));
          navigate("/");
        }
      } catch (err) {
        showError(t("password.invalidLinkDesc"));
        console.error(err);
        navigate("/");
      }
    };
    verifyToken();
  }, []);

  // Validate Realtime
  useEffect(() => {
    // Chỉ thực hiện validate nếu link hợp lệ
    if (!token || !email) return;

    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = t("password.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("password.passwordMin");
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t("password.confirmRequired");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("password.passwordMismatch");
    }

    setErrors(newErrors);
  }, [password, confirmPassword, token, email, t]);

  // 1. KIỂM TRA ĐIỀU KIỆN HỢP LỆ CỦA URL NGAY TỪ ĐẦU
  const isLinkInvalid = !token.trim() || !email.trim();

  // Nếu link thiếu thông tin, hiển thị màn hình thông báo lỗi (Not Found / Invalid Link)
  if (isLinkInvalid) {
    return (
      <div className={styles.resetPage}>
        <div className={styles.backgroundGlow} />
        <div className={styles.resetCard}>
          <div className={styles.header}>
            <div className={`${styles.logoWrapper}`} style={{ borderColor: "var(--danger-border)", color: "var(--danger)" }}>
              {/* Icon cảnh báo lỗi / Không tìm thấy */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 style={{ color: "var(--danger)" }}>
              {t("password.invalidLinkTitle")}
            </h1>
            <p style={{ marginTop: "16px" }}>
              {t(
                "password.invalidLinkDesc"
              )}
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className={styles.submitBtn}
            style={{ width: "100%", marginTop: "12px" }}
          >
            {t("password.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  // 2. NẾU LINK HỢP LỆ -> HIỂN THỊ FORM ĐỔI MẬT KHẨU NHƯ BÌNH THƯỜNG
  const isFormValid =
    password.length >= 6 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const { error } = await resetPassword(email, token, password);
      if (error) {
        showError(t("password.errorChange"));
        console.error(error);
      } else {
        showToast(t("password.successChange"), "success");
        navigate("/");
      }
    } catch (err) {
      showError(t("password.errorChange"));
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1>{t("password.resetPassword")}</h1>
          <p>
            {t("password.resetRequestFor", "Thiết lập mật khẩu mới cho tài khoản")}{" "}
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>{t("password.newPassword")}</label>
            <input
              type="password"
              placeholder={t("password.newPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? styles.inputError : ""}
              required
            />
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>{t("password.confirmPassword")}</label>
            <input
              type="password"
              placeholder={t("password.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? styles.inputError : ""}
              required
            />
            {errors.confirmPassword && (
              <span className={styles.errorText}>{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !isFormValid}
          >
            {loading ? t("common.loading") : t("password.updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;