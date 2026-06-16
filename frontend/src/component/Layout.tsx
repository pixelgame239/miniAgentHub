// components/Layout.tsx
import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import Sidebar from "./SideBar.tsx";
import styles from "../styles/layout.module.css"; 
import ErrorBoundary from "./ErrorBoundary.tsx";
import NotificationPopup from "./NotificationPopup.tsx";
import { useNotificationPopup } from "../context/NotificationPopupContext.tsx";

const Layout = () => {
  const { error, info, errorMessage, infoMessage, closePopup } = useNotificationPopup();
  // State quản lý trạng thái đóng/mở sidebar trên Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tự động đóng sidebar mobile khi người dùng chuyển trang (route thay đổi)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [Outlet]);

  return (
    <div className={styles["chat-container"]}>
      {/* Nút Hamburger chỉ hiển thị trên Mobile */}
      <button 
        className={styles["hamburger-btn"]} 
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Lớp nền mờ overlay phía sau Sidebar khi mở trên Mobile */}
      {isSidebarOpen && (
        <div 
          className={styles["sidebar-overlay"]} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ErrorBoundary fallback={<div className={styles["sidebar-error"]}>Sidebar isn't available now</div>}>
         {/* Truyền trạng thái và hàm đóng vào Sidebar */}
         <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </ErrorBoundary>

      <main className={styles["chat-main"]}>
        <div className={styles["page-scroll-container"]}>
          <ErrorBoundary fallback={<div className={styles["sidebar-error"]}>Mainscreen isn't available now</div>}>
              <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <NotificationPopup error={error} info={info} errorMessage={errorMessage} infoMessage={infoMessage} onClose={closePopup} />
    </div>
  );
};

export default Layout;