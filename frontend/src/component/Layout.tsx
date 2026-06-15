// components/Layout.tsx
import { Outlet } from "react-router";
import Sidebar from "./SideBar.tsx";
import styles from "../styles/layout.module.css"; // Changed to CSS Module
import ErrorBoundary from "./ErrorBoundary.tsx";
import NotificationPopup from "./NotificationPopup.tsx";
import { useNotificationPopup } from "../context/NotificationPopupContext.tsx";

const Layout = () => {
  const { error, info, errorMessage, infoMessage, closePopup } = useNotificationPopup();

  return (
    <div className={styles["chat-container"]}>
      <ErrorBoundary fallback={<div className={styles["sidebar-error"]}>Sidebar isn't available now</div>}>
            <Sidebar />
      </ErrorBoundary>
      {/* ADD THIS WRAPPER */}
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