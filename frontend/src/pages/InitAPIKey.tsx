import { useEffect, useState } from "react";
import styles from "../styles/initApiKey.module.css"; // Nhập styles từ module vừa tạo
import { useTranslation } from "react-i18next";
import { getGroqModels } from "../api/aiApi";
import { useNavigate } from "react-router";
import { updateUserAPIKey } from "../api/userApi";

const InitAPIKey = () => {
  const [apiKey, setApiKey] = useState("");
  const { t } = useTranslation(); // Sử dụng hook useTranslation để lấy hàm dịch
  const [error, setError] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Đảm bảo đồng bộ theme từ localStorage lên thuộc tính HTML
    document.documentElement.setAttribute(
      "data-theme",
      localStorage.getItem("app-theme") || "light"
    );
  }, []);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    const { data: getModelsData, error: getModelsError } = await getGroqModels(apiKey.trim());
    if (getModelsData) {
      localStorage.setItem("APIKey", apiKey.trim());
      const { data: insertAPIKeyData, error: insertAPIKeyError } = await updateUserAPIKey(apiKey.trim(), JSON.parse(localStorage.getItem("user") || "{}").id);
        if(insertAPIKeyError){
            console.error("Failed to save API key:", insertAPIKeyError);
            setError(true);
            return;
        }
      nav("/");
    } else if (getModelsError) {
      console.error("Failed to verify API key:", getModelsError);
      setError(true);
    } 
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("initAPIKey.title")}</h1>
        <p className={styles.description}>
          {t("initAPIKey.description")}
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="apiKey" className={styles.label}>
              {t("initAPIKey.inputPlaceholder")}
            </label>
            <div className={styles.inputWrapper}>
                <input
                    id="apiKey"
                    type="password"
                    required 
                    className={`${styles.input} ${error ? styles.inputError : ""}`} 
                    placeholder={t("initAPIKey.inputPlaceholder")}
                    value={apiKey}
                    onChange={(e) => {
                    setApiKey(e.target.value);
                    if (error) setError(false);
                    }}
                />
                </div>
                  {error && (
                    <p className={styles.errorMessage}>
                    {t("initAPIKey.errorMessage")}
                    </p>
                )}
          </div>

          <button type="submit" className={styles.submitBtn}>
            {t("initAPIKey.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitAPIKey;