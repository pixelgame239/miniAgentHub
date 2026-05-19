// components/Layout.tsx
import { Outlet } from "react-router";
import Sidebar from "./SideBar.tsx";
import styles from "../styles/layout.module.css"; // Changed to CSS Module
import ErrorBoundary from "./ErrorBoundary.tsx";

const Layout = () => {
  return (
    <div className={styles["chat-container"]}>
      <ErrorBoundary fallback={<div className={styles["sidebar-error"]}>Sidebar tạm thời không khả dụng.</div>}>
            <Sidebar />
      </ErrorBoundary>
      {/* ADD THIS WRAPPER */}
      <main className={styles["chat-main"]}>
        <div className={styles["page-scroll-container"]}>
          <ErrorBoundary fallback={<div className={styles["sidebar-error"]}>Cửa sổ chính tạm thời không khả dụng.</div>}>
              <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Layout;