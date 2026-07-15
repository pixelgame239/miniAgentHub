import { useState, useId, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import styles from "../styles/login.module.css"; // Dùng chung file CSS để đồng bộ giao diện
import { sendResetPasswordMagicLink } from "../api/authApi";

const ForgotPasswordPage = () => {
  const nav = useNavigate();
  const id = useId();
  const { t } = useTranslation();
  const { showError, showToast } = useNotificationPopup();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isTouched, setIsTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const appLang = localStorage.getItem("app-lang") || "en";

  const validateEmailFormat = (val: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(val);
  };

  // Đồng bộ theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "dark");
  }, []);

  // Validate real-time khi người dùng thay đổi dữ liệu
  useEffect(() => {
    if (!isTouched) return;

    if (!email.trim()) {
      setEmailError(t("login.invalidEmail"));
    } else if (!validateEmailFormat(email)) {
      setEmailError(t("login.invalidEmail"));
    } else {
      setEmailError("");
    }
  }, [email, isTouched, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setIsTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTouched(true);

    if (!validateEmailFormat(email)) {
      setEmailError(t("login.invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      // Giả lập kết quả gọi API khôi phục mật khẩu
      const { data, error } = await sendResetPasswordMagicLink(email, appLang);
      if (error) {
        if(error.status!==500){
          showError(error.message);
        }
        else{
          showError(t("login.emailSentFailed"));
        }
        console.error(error);
        return;
      }else{
        // 1. Kích hoạt thông báo thành công (Popup nằm ở file App.tsx/Layout cha sẽ nhận diện được)
        showToast(t("login.emailSentSuccess"), "success"); 
        
        // 2. Chuyển hướng trực tiếp về trang login mà không cần qua bước trung gian
        nav("/");
      }
    } catch (err) {
      showError(t("login.emailSentFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["login-container"]}>
      {/* Background circles đồng bộ */}
      <div className={styles["login-background"]}>
        <div className={`${styles["circle"]} ${styles["circle-1"]}`} />
        <div className={`${styles["circle"]} ${styles["circle-2"]}`} />
        <div className={`${styles["circle"]} ${styles["circle-3"]}`} />
      </div>

      <div className={styles["login-card"]}>
        {/* Nút quay lại trang Đăng nhập */}
        <button 
          className={styles["back-to-site"]} 
          onClick={() => nav("/")} 
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t("common.backToLogin")}</span>
        </button>

        <div className={styles["login-header"]} style={{ marginTop: "1.5rem" }}>
          <span className={styles["secure-access-badge"]}>{t("login.secureAccess")}</span>
          <h1>Agent Hub</h1>
          <h2>{t("login.forgotPasswordTitle")}</h2>
        </div>

        <p className={styles["welcome-message"]}>
          {t("login.forgotPasswordDesc")}
        </p>

        <form className={styles["login-form"]} onSubmit={handleSubmit}>
          {/* KHỐI EMAIL */}
          <div className={styles["form-group"]}>
            <label htmlFor={`${id}-email`} className={styles["form-label"]}>
              {t("login.email")}
            </label>
            <div className={styles["input-wrapper"]}>
              <input
                id={`${id}-email`}
                name="email"
                type="text"
                required
                value={email}
                onChange={handleChange}
                className={`${styles["form-input"]} ${emailError ? styles["input-error"] : ""}`}
                placeholder="name@company.com"
              />
              <div className={styles["input-icon"]}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>
            {emailError && (
              <span className={styles["error-message"]}>
                {emailError}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={styles["login-button"]}
            disabled={!!emailError || !email.trim() || loading}
            style={{ 
              opacity: (!!emailError || !email.trim() || loading) ? 0.6 : 1, 
              cursor: (!!emailError || !email.trim() || loading) ? "not-allowed" : "pointer" 
            }}
          >
            {t("login.sendResetLink")}
          </button>
        </form>

        <div className={styles["login-footer"]}>
          <div className={styles["security-info"]}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>END-TO-END ENCRYPTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;