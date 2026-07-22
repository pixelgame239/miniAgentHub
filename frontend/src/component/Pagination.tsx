import React from "react";
import styles from "../styles/user.module.css";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Đảm bảo totalPages tối thiểu là 1 nếu truyền vào <= 0 hoặc undefined
  const validTotalPages = Math.max(1, totalPages || 1);
  const {t} = useTranslation();

  // Thuật toán tạo danh sách nút bấm số trang (1, 2, ..., 5)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Số trang hiển thị cạnh trang hiện tại

    for (let i = 1; i <= validTotalPages; i++) {
      if (
        i === 1 ||
        i === validTotalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        pages[pages.length - 1] !== "..." &&
        (i < currentPage - delta || i > currentPage + delta)
      ) {
        pages.push("...");
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={styles.pagination}>
      <div className={styles.paginationControls}>
        {/* Nút Prev */}
        <button
          className={styles.pageBtn}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title={t("users.previousPage")}
        >
          &lt;
        </button>

        {/* Danh sách các Nút Số Trang */}
        {pageNumbers.map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              className={`${styles.pageBtn} ${
                page === currentPage ? styles.activePageBtn : ""
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ) : (
            <span key={index} className={styles.pageEllipsis}>
              {page}
            </span>
          )
        )}

        {/* Nút Next */}
        <button
          className={styles.pageBtn}
          disabled={currentPage >= validTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title={t("users.nextPage")}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;