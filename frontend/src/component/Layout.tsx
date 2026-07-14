// components/Layout.tsx
import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import Sidebar from "./SideBar.tsx";
import styles from "../styles/layout.module.css"; 
import ErrorBoundary from "./ErrorBoundary.tsx";

const Layout = () => {
  // Lấy chính xác cụm dữ liệu phân tách từ Context mới
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [Outlet]);

  return (
    <div className={styles["chat-container"]}>
      {/* Nút Hamburger mở menu trên Mobile */}
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

      {/* Nền mờ overlay */}
      {isSidebarOpen && (
        <div 
          className={styles["sidebar-overlay"]} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ErrorBoundary fallback={<div className={styles["sidebar-error"]}>Sidebar isn't available now</div>}>
         <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </ErrorBoundary>

      <main className={styles["chat-main"]}>
        <div className={styles["page-scroll-container"]}>
          <ErrorBoundary fallback={<div className={styles["sidebar-error"]}>Mainscreen isn't available now</div>}>
              <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Layout;