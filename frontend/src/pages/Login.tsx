import { useState, useId, type SubmitEvent, useEffect } from "react";
import { useNavigate } from "react-router";
import { login } from "../api/authApi";
import styles from "../styles/login.module.css"; // Changed to CSS Module
import { useAuth } from "../hooks/authHook";
import { getToken } from "../api/apiClient";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const nav = useNavigate();
  const id = useId(); // unique ID prefix for accessibility
  const { user, setUser } = useAuth();
  useEffect(() => {
    const token = getToken();
    if (user || token) {
      nav("/chat");
    }
  }, []);
  const [formData, setFormData] = useState({
    email: "",
    userPassword: "",
  });
  const [visible, setVisible] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => setVisible((prev) => !prev);
  const { t } = useTranslation();

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    try {
      const response = await login(formData);
      console.log(response);
      if (response.data?.token) {
        localStorage.setItem("accessToken", response.data.token);
        setUser(response.data.userData);
        nav("/chat");
      }
    } catch (error) {
      alert(error);
      console.error(error);
    }
  };

  return (
    <div className={styles["login-container"]}>
      {/* Background decorations */}
      <div className={styles["login-background"]}>
        <div className={`${styles["circle"]} ${styles["circle-1"]}`} />
        <div className={`${styles["circle"]} ${styles["circle-2"]}`} />
        <div className={`${styles["circle"]} ${styles["circle-3"]}`} />
      </div>

      {/* Login Card */}
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
                className={styles["form-input"]}
                placeholder="name@company.com"
                required
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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>
          </div>

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
                className={styles["form-input"]}
                placeholder={t("login.enterPassword")}
                required
              />
              <button
                type="button"
                className={styles["password-toggle"]}
                onClick={togglePasswordVisibility}
                aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className={styles["login-button"]}>
            {t("login.continue")}
          </button>
        </form>

        <div className={styles["login-footer"]}>
          <div className={styles["security-info"]}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>END-TO-END ENCRYPTED</span>
          </div>
          <div className={styles["security-info"]}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>ISO 27001 CERTIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;