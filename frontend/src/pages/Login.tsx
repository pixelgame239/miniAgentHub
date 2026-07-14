import { useState, useId, type SubmitEvent, useEffect } from "react";
import { useNavigate } from "react-router";
import { getMe, login } from "../api/authApi";
import styles from "../styles/login.module.css"; 
import { useAuth } from "../hooks/authHook";
import { useTranslation } from "react-i18next";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import NotificationPopup from "../component/NotificationPopup";

const LoginPage = () => {
  const nav = useNavigate();
  const id = useId(); 
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const { popup, closePopup, showError } = useNotificationPopup();
  
  // States dữ liệu form
  const [formData, setFormData] = useState({
    email: "",
    userPassword: "",
  });
  const [visible, setVisible] = useState(false);

  // States quản lý lỗi tại dòng input
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState(""); // Lỗi sai mật khẩu hoặc tài khoản không tồn tại
  
  // State theo dõi xem người dùng đã tương tác (gõ) vào ô Email chưa
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  
  const validateEmailFormat = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "dark");
  }, []);

  useEffect(() => {
    if (user) {
      nav("/chat");
    }else{
      const initUser = async () => {
        const { data, error } = await getMe();
        if (data) {
          setUser(data);
          nav("/chat");
        } 
      };
      initUser();
    }
  }, [user, nav]);

  // REAL-TIME VALIDATION: Tự động bắt lỗi Email khi dữ liệu thay đổi
  useEffect(() => {
    if (!isEmailTouched) return;

    if (!formData.email.trim()) {
      setEmailError(t("login.emailRequired") || "Email không được để trống"); // Fallback text phòng khi thiếu key i18n
    } else if (!validateEmailFormat(formData.email)) {
      setEmailError(t("login.invalidEmail"));
    } else {
      setEmailError(""); // Xóa chữ đỏ báo lỗi ngay lập tức khi hợp lệ
    }
  }, [formData.email, isEmailTouched, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "email") {
      setIsEmailTouched(true); // Đánh dấu người dùng đã gõ vào ô email
      setLoginError("");       // Xóa lỗi đăng nhập từ backend khi sửa thông tin
    }
    if (name === "userPassword") {
      setLoginError("");
    }
  };

  const togglePasswordVisibility = () => setVisible((prev) => !prev);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    // Đánh dấu đã touched tất cả để kích hoạt validate nếu bấm submit vội
    setIsEmailTouched(true);

    // Kiểm tra nhanh lại định dạng email lần cuối trước khi gửi request
    if (!validateEmailFormat(formData.email)) {
      setEmailError(t("login.invalidEmail"));
      return;
    }

    const { data, error } = await login(formData);
    console.log("Login response:", { data, error }); // Debug: log phản hồi từ backend
    if (data) {
      setUser(data);
      nav("/chat");
    } else if (error) {
      // Nhận phản hồi lỗi từ backend, map thẳng vào ô password
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
                type="text" // Chuyển sang text để tự custom validate bằng regex, tránh tooltip mặc định của trình duyệt đè lên giao diện
                value={formData.email}
                onChange={handleChange}
                className={`${styles["form-input"]} ${(emailError || loginError) ? styles["input-error"] : ""}`}
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
              />
              <div className={styles["input-icon"]}>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {/* Thân khóa */}
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  {/* Quai khóa */}
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
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
            {loginError && (
              <span className={styles["error-message"]}>
                {loginError}
              </span>
            )}
          </div>
          <div className={styles["forgot-password-wrapper"]}>
            <button
              type="button"
              className={styles["forgot-password-link"]}
              onClick={() => nav("/forgotPassword")}
            >
              {t("login.forgotPassword") || "Quên mật khẩu?"}
            </button>
          </div>

          <button 
            type="submit" 
            className={styles["login-button"]}
            disabled={!!emailError} // Chặn bấm submit nếu như format email đang bị gõ lỗi
          >
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