import { useEffect, useState, useRef } from "react";
import styles from "../styles/apiKeyModal.module.css"; // Nhớ tạo file CSS mới hoặc cập nhật module CSS
import { useTranslation } from "react-i18next";
import { getGroqModels } from "../api/aiApi"; // Giữ nguyên nếu bạn vẫn muốn verify qua Groq, hoặc tùy chỉnh theo model
import { updateUserAIConfig } from "../api/userApi";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: string | undefined; // Nhận model đang được chọn từ ChatPage
}

const ApiKeyModal = ({ isOpen, onClose, modelId }: ApiKeyModalProps) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const [apiKey, setApiKey] = useState("");
  const [flowiseUrl, setFlowiseUrl] = useState(""); // State cho URL nếu là Flowise
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kiểm tra xem model hiện tại có phải Flowise không
  const isFlowise = modelId?.startsWith("flowise") ?? false;

  // Reset dữ liệu mỗi khi mở Modal
  useEffect(() => {
    if (isOpen) {
      setApiKey("");
      setFlowiseUrl("");
      setError(false);
    }
  }, [isOpen]);

  // Xử lý Behavior: Bấm ra ngoài vùng Modal để đóng
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

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    if (isFlowise && !flowiseUrl.trim()) return;

    setIsSubmitting(true);
    setError(false);

    try {
      const userId = JSON.parse(localStorage.getItem("user") || "{}").id;

      // Lưu trữ local tạm thời tùy logic dự án của bạn
      localStorage.setItem("APIKey", apiKey.trim());
      if (isFlowise) {
        localStorage.setItem("FlowiseURL", flowiseUrl.trim());
      }

      // Gọi API cập nhật API Key / URL lên DB cho User
      // Bạn có thể mở rộng hàm `updateUserAIConfig` để truyền thêm flowiseUrl nếu cần thiết
      const { error: insertAPIKeyError } = await updateUserAIConfig(
        {
          FlowiseAPIKey: isFlowise ? apiKey.trim() : undefined,
          FlowiseURL: isFlowise ? flowiseUrl.trim() : undefined,
          DeepSeekAPIKey: !isFlowise ? apiKey.trim() : undefined
        },
        userId
      );

      if (insertAPIKeyError) {
        console.error("Failed to save API key:", insertAPIKeyError);
        setError(true);
        return;
      }

      onClose(); // Đóng modal sau khi hoàn thành lưu cấu hình thành công
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
        <h2 className={styles.title}>
          {isFlowise ? "Cấu hình Flowise" : t("initAPIKey.title")}
        </h2>
        <p className={styles.description}>
          {isFlowise ? `Vui lòng cung cấp thông tin kết nối cho mẫu: ${modelId}` : t("initAPIKey.description")}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Trường nhập API Key (Luôn luôn có) */}
          <div className={styles.formGroup}>
            <label htmlFor="apiKey" className={styles.label}>
              {isFlowise ? "Flowise API Key (Token)" : t("initAPIKey.inputPlaceholder")}
            </label>
            <input
              id="apiKey"
              type="password"
              required
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              placeholder="Nhập API Key tại đây..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (error) setError(false);
              }}
            />
          </div>

          {/* Trường nhập Flowise URL bổ sung (Chỉ hiện khi modelId startswith 'flowise') */}
          {isFlowise && (
            <div className={styles.formGroup}>
              <label htmlFor="flowiseUrl" className={styles.label}>
                Flowise API URL Endpoint
              </label>
              <input
                id="flowiseUrl"
                type="url"
                required
                className={`${styles.input} ${error ? styles.inputError : ""}`}
                placeholder="https://your-flowise-instance.com/api/v1/prediction/..."
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
              {t("initAPIKey.errorMessage") || "Đã xảy ra lỗi, vui lòng kiểm tra lại dữ liệu."}
            </p>
          )}

          {/* Cụm nút hành động chuẩn Pop-up */}
          <div className={styles.actionActions}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "OK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;