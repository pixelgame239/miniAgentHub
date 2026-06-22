import { useState, useId, type SubmitEvent, useEffect } from "react";
import { useNavigate } from "react-router";
import { login } from "../api/authApi";
import styles from "../styles/login.module.css"; 
import { useAuth } from "../hooks/authHook";
import { getToken } from "../api/apiClient";
import { useTranslation } from "react-i18next";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import NotificationPopup from "../component/NotificationPopup";

const LoginPage = () => {
  const nav = useNavigate();
  const id = useId(); 
  const { user, setUser } = useAuth();
  
  // States quản lý lỗi tại dòng input
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState(""); // Lỗi sai mật khẩu hoặc tài khoản không tồn tại

  const { popup, closePopup, showError } = useNotificationPopup();
  
  const validateEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "light");
  }, []);

  useEffect(() => {
    const token = getToken();
    if (user || token) {
      nav("/chat");
    }
  }, [user, nav]);

  const [formData, setFormData] = useState({
    email: "",
    userPassword: "",
  });
  const [visible, setVisible] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Khi người dùng gõ lại dữ liệu, tự động xóa thông báo lỗi đi
    if (name === "email") {
      setEmailError("");
      setLoginError("");
    }
    if (name === "userPassword") {
      setLoginError("");
    }
  };

  const togglePasswordVisibility = () => setVisible((prev) => !prev);
  const { t } = useTranslation();

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    // Reset toàn bộ lỗi trước khi submit
    setEmailError("");
    setLoginError("");

    if (!validateEmail(formData.email)) {
      setEmailError(t("login.invalidEmail"));
      return;
    }

    const { data, error } = await login(formData);
    if (data && data.token) {
      localStorage.setItem("accessToken", data.token);
      setUser(data.userData);
      if (data.userData.APIKey) {
        localStorage.setItem("APIKey", data.userData.APIKey);
      }
      nav("/chat");
    } else if (error) {
      // Thay vì hiển thị popup chung chung, hiển thị lỗi ngay dưới ô Password
      setLoginError(t("login.error")); 
    } else {
      showError(t("common.InternalError"));
    }
  };

  return (
    <div className={styles["login-container"]}>
      <div className={styles["login-background"]}>
        <div className={`${styles["circle"]} ${styles["circle-1"]}`} />
        <div className={`${styles["circle"]} ${styles["circle-2"]}`} />
        <div className={`${styles["circle"]} ${styles["circle-3"]}`} />
      </div>

      <div className={styles["login-card"]}>
        <div className={styles["login-header"]}>
          <span className={styles["secure-access-badge"]}>{t("login.secureAccess")}</span>
          <h1>Agent Hub</h1>
          <h2>{t("login.login")}</h2>
        </div>

        <p className={styles["welcome-message"]}>
          {t("login.welcome")}
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
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles["form-input"]} ${(emailError || loginError) ? styles["input-error"] : ""}`}
                placeholder="name@company.com"
                required
              />
              <div className={styles["input-icon"]}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>
            {/* Đưa lỗi ra ngoài input-wrapper để tránh xung đột với Flexbox ngang */}
            {emailError && (
              <span className={styles["error-message"]}>
                {emailError}
              </span>
            )}
          </div>

          {/* KHỐI PASSWORD */}
          <div className={styles["form-group"]}>
            <label htmlFor={`${id}-password`} className={styles["form-label"]}>
              {t("login.password")}
            </label>
            <div className={styles["input-wrapper"]}>
              <input
                id={`${id}-password`}
                name="userPassword"
                type={visible ? "text" : "password"}
                value={formData.userPassword}
                onChange={handleChange}
                className={`${styles["form-input"]} ${loginError ? styles["input-error"] : ""}`}
                placeholder={t("login.enterPassword")}
                required
              />
              <button
                type="button"
                className={styles["password-toggle"]}
                onClick={togglePasswordVisibility}
                aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {/* Hiển thị lỗi sai tài khoản / mật khẩu ngay dưới trường Password */}
            {loginError && (
              <span className={styles["error-message"]}>
                {loginError}
              </span>
            )}
          </div>

          <button type="submit" className={styles["login-button"]}>
            {t("login.continue")}
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
          <div className={styles["security-info"]}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>ISO 27001 CERTIFIED</span>
          </div>
        </div>
      </div>
      <NotificationPopup isOpen={popup.isOpen} message={popup.message} type={popup.type} onClose={closePopup} />
    </div>
  );
};

export default LoginPage;