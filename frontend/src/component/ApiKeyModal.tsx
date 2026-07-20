import { useEffect, useState, useRef } from "react";
import styles from "../styles/apiKeyModal.module.css"; 
import { useTranslation } from "react-i18next";
import { updateUserAIConfig } from "../api/userApi";
import { useAuth } from "../hooks/authHook";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: string; 
}

// Khai báo kiểu dữ liệu cho object chứa lỗi validate của từng ô input
interface FormErrors {
  apiKey?: string;
  flowiseUrl?: string;
}

const ApiKeyModal = ({ isOpen, onClose, provider }: ApiKeyModalProps) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); 

  const [apiKey, setApiKey] = useState("");
  const [flowiseUrl, setFlowiseUrl] = useState(""); 
  const [apiError, setApiError] = useState(false); // Lỗi từ phía backend/server
  const [errors, setErrors] = useState<FormErrors>({}); // Lỗi validate realtime từng ô
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFlowise = provider === "flowise";
  const isGroq = provider === "groq";
  const isOpenRouter = provider === "openRouter";

  // Reset toàn bộ form khi đóng/mở hoặc chuyển provider
  useEffect(() => {
    if (isOpen) {
      setApiKey("");
      setFlowiseUrl("");
      setApiError(false);
      setErrors({});
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

  // --- HÀM VALIDATE REALTIME CHO TỪNG INPUT ---
  const validateField = (name: "apiKey" | "flowiseUrl", value: string) => {
    let errorMsg = "";
    
    if (name === "apiKey" && !value.trim() && !isFlowise) {
      errorMsg = t("APIKeyModal.apiKeyRequired");
    }
    
    if (name === "flowiseUrl" && isFlowise && !value.trim()) {
      errorMsg = t("APIKeyModal.urlRequired");
    }

    // Cập nhật lại danh sách lỗi realtime
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(false);

    // Validate tổng lực lần cuối trước khi gửi data lên server
    const currentErrors: FormErrors = {};
    if (!apiKey.trim()&& !isFlowise) {
      currentErrors.apiKey = t("APIKeyModal.apiKeyRequired");
    }
    if (isFlowise && !flowiseUrl.trim()) {
      currentErrors.flowiseUrl = t("APIKeyModal.urlRequired");
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return; // Chặn submit nếu có lỗi
    }

    setIsSubmitting(true);

    try {
      const configPayload = {
        FlowiseAPIKey: isFlowise ? apiKey.trim() : undefined,
        FlowiseUrl: isFlowise ? flowiseUrl.trim() : undefined,
        GroqAPIKey: isGroq ? apiKey.trim() : undefined,
        OpenRouterAPIKey: isOpenRouter ? apiKey.trim() : undefined,
      };

      const { error: insertAPIKeyError } = await updateUserAIConfig(configPayload, user?.id);

      if (insertAPIKeyError) {
        console.error("Failed to save API key:", insertAPIKeyError);
        setApiError(true);
        return;
      }

      onClose(); 
    } catch (err) {
      console.error(err);
      setApiError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card} ref={modalRef}>
        <h2 className={styles.title}>{getModalTitle()}</h2>

        <form onSubmit={handleSubmit} noValidate>
          
          {/* Cụm Input 1: API Key */}
          <div className={styles.formGroup}>
            <label htmlFor="apiKey" className={styles.label}>
              {getInputLabel()} <span className={isFlowise ? "": styles.requiredStar}>{isFlowise ? "" : "*"}</span>
            </label>
            <input
              id="apiKey"
              type="password"
              className={`${styles.input} ${errors.apiKey ? styles.inputError : ""}`}
              placeholder={t("APIKeyModal.inputPlaceholder")}
              value={apiKey}
              onChange={(e) => {
                const val = e.target.value;
                setApiKey(val);
                validateField("apiKey", val);
              }}
            />
            {errors.apiKey && (
              <p className={styles.fieldErrorMessage}>{errors.apiKey}</p>
            )}
          </div>

          {/* Cụm Input 2: Flowise URL (Chỉ hiển thị khi chọn Flowise) */}
          {isFlowise && (
            <div className={styles.formGroup}>
              <label htmlFor="flowiseUrl" className={styles.label}>
                Flowise Endpoint URL <span className={styles.requiredStar}>*</span>
              </label>
              <input
                id="flowiseUrl"
                type="url"
                placeholder={t("APIKeyModal.flowiseInputPlaceholder")}
                className={`${styles.input} ${errors.flowiseUrl ? styles.inputError : ""}`}
                value={flowiseUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setFlowiseUrl(val);
                  validateField("flowiseUrl", val);
                }}
              />
              {errors.flowiseUrl && (
                <p className={styles.fieldErrorMessage}>{errors.flowiseUrl}</p>
              )}
            </div>
          )}

          {/* Lỗi hệ thống từ API (nếu có) */}
          {apiError && (
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
              disabled={isSubmitting || isFlowise && !flowiseUrl.trim() || !isFlowise && !apiKey.trim()}
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