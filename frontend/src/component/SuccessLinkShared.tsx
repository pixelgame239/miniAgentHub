import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../styles/sidebar.module.css"; // Dùng chung file CSS để đồng bộ giao diện

interface SuccessLinkSharedProps {
  linkToCopy: string;
}

const SuccessLinkShared = ({ linkToCopy }: SuccessLinkSharedProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      // Reset trạng thái nút copy sau 2 giây
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Không thể copy link: ", err);
    }
  };

  return (
    <div className={styles["success-link-card"]}>
      {/* Icon check tròn xanh lục biểu thị thành công */}
      <div className={styles["success-icon-wrapper"]}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      {/* Message thông báo thành công lấy từ file dịch thuật t() */}
      <h3 className={styles["success-title"]}>
        {t("common.success")}
      </h3>

      <p className={styles["success-description"]}>
        {t("sidebar.copyLinkInstructions")}
      </p>

      {/* Container chứa Link & Nút Copy */}
      <div className={styles["copy-link-container"]}>
        <input
          type="text"
          readOnly
          value={linkToCopy}
          className={styles["copy-link-input"]}
          onClick={(e) => (e.target as HTMLInputElement).select()} // Tự động bôi đen toàn bộ link khi click vào ô input
        />
        <button
          type="button"
          onClick={handleCopy}
          className={`${styles["copy-btn"]} ${copied ? styles["copied"] : ""}`}
          aria-label="Copy link"
        >
          {copied ? (
            // Icon Đã Copy thành công (Check xanh lá)
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles["icon-check"]}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            // Icon Sao chép (Copy)
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <span>{copied ? t("sidebar.copied") : t("sidebar.copyLink")}</span>
        </button>
      </div>
    </div>
  );
};

export default SuccessLinkShared;