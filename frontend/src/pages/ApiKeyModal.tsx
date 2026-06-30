import { useEffect, useState, useRef } from "react";
import styles from "../styles/apiKeyModal.module.css"; 
import { useTranslation } from "react-i18next";
import { updateUserAIConfig } from "../api/userApi";
import { useAuth } from "../hooks/authHook";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: string; // Nhận chuẩn id: "flowise" | "openRouter" | "groq" từ ChatPage
}

const ApiKeyModal = ({ isOpen, onClose, provider }: ApiKeyModalProps) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); 

  const [apiKey, setApiKey] = useState("");
  const [flowiseUrl, setFlowiseUrl] = useState(""); 
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // So khớp logic chuẩn xác theo ID danh mục được truyền từ ChatPage
  const isFlowise = provider === "flowise";
  const isGroq = provider === "groq";
  const isOpenRouter = provider === "openRouter";

  // Reset dữ liệu mỗi khi mở/đóng Modal hoặc thay đổi modelId
  useEffect(() => {
    if (isOpen) {
      setApiKey("");
      setFlowiseUrl("");
      setError(false);
    }
  }, [isOpen, provider]);

  // Xử lý đóng Modal khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Giữ nguyên logic hiển thị dựa trên flag phân tách rõ ràng
  const getModalTitle = () => {
    if (isFlowise) return t("APIKeyModal.flowiseTitle");
    return t("APIKeyModal.title");
  };

  const getInputLabel = () => {
    if (isFlowise) return "Flowise API Key";
    if (isGroq) return "Groq API Key";
    if (isOpenRouter) return "OpenRouter API Key";
    return "API Key";
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    if (isFlowise && !flowiseUrl.trim()) return;

    setIsSubmitting(true);
    setError(false);

    try {
      // Chuẩn bị payload: Map chính xác theo trạng thái boolean xử lý từ provider id
      const configPayload = {
        FlowiseAPIKey: isFlowise ? apiKey.trim() : undefined,
        FlowiseURL: isFlowise ? flowiseUrl.trim() : undefined,
        GroqAPIKey: isGroq ? apiKey.trim() : undefined,
        OpenRouterAPIKey: isOpenRouter ? apiKey.trim() : undefined,
      };

      // Gọi API cập nhật cấu hình lên DB
      const { error: insertAPIKeyError } = await updateUserAIConfig(
        configPayload,
        user?.id
      );

      if (insertAPIKeyError) {
        console.error("Failed to save API key:", insertAPIKeyError);
        setError(true);
        return;
      }

      onClose(); 
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card} ref={modalRef}>
        <h2 className={styles.title}>{getModalTitle()}</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="apiKey" className={styles.label}>
              {getInputLabel()}
            </label>
            <input
              id="apiKey"
              type="password"
              required
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              placeholder={t("APIKeyModal.inputPlaceholder")}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (error) setError(false);
              }}
            />
          </div>

          {isFlowise && (
            <div className={styles.formGroup}>
              <label htmlFor="flowiseUrl" className={styles.label}>
                "Flowise Endpoint URL"
              </label>
              <input
                id="flowiseUrl"
                type="url"
                required
                placeholder={t("APIKeyModal.flowiseInputPlaceholder")}
                className={`${styles.input} ${error ? styles.inputError : ""}`}
                value={flowiseUrl}
                onChange={(e) => {
                  setFlowiseUrl(e.target.value);
                  if (error) setError(false);
                }}
              />
            </div>
          )}

          {error && (
            <p className={styles.errorMessage}>
              {t("APIKeyModal.errorMessage")}
            </p>
          )}

          <div className={styles.actionActions}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </button>
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.loading") : "OK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;