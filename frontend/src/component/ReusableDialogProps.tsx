import type { ReactNode } from "react";
import styles from "../styles/sidebar.module.css";

type ReusableDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function ReusableDialog({
  open,
  title,
  onClose,
  children,
  footer,
}: ReusableDialogProps) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>{children}</div>

        {footer ? <div className={styles.modalFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}