// component/ExportModal.tsx
import styles from "../styles/exportModal.module.css";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "docx" | "pdf") => void;
}

const ExportModal = ({ isOpen, onClose, onExport }: ExportModalProps) => {
  if (!isOpen) return null;

  // SVG Icon cho tài liệu Microsoft Word (.docx)
  const DocxIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );

  // SVG Icon cho tài liệu định dạng PDF
  const PdfIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="10" cy="14" r="2" />
      <path d="m12 14 3 3" />
    </svg>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>Xuất cuộc hội thoại</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className={styles.optionsGrid}>
          {/* Tùy chọn Word */}
          <button className={styles.optionCard} onClick={() => onExport("docx")}>
            <div className={`${styles.iconWrapper} ${styles.docxStyle}`}>
              <DocxIcon />
            </div>
            <div className={styles.meta}>
              <p className={styles.optTitle}>Microsoft Word (.docx)</p>
              <p className={styles.optDesc}>Thích hợp để chỉnh sửa tiếp nội dung</p>
            </div>
          </button>

          {/* Tùy chọn PDF */}
          <button className={styles.optionCard} onClick={() => onExport("pdf")}>
            <div className={`${styles.iconWrapper} ${styles.pdfStyle}`}>
              <PdfIcon />
            </div>
            <div className={styles.meta}>
              <p className={styles.optTitle}>Tài liệu PDF (.pdf)</p>
              <p className={styles.optDesc}>Phù hợp để lưu trữ, in ấn hoặc chia sẻ</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;