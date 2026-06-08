// pages/SettingsPage.tsx
import React, { useEffect, useState } from "react";
import styles from "../styles/settings.module.css"; // Changed to CSS Module
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/authHook";
import { removeToken } from "../api/apiClient";
import UpdatePasswordModal from "../component/UpdatePasswordModal";
import { changePassword } from "../api/authApi";
import { useTranslation } from "react-i18next";
import { deleteAllConversations } from "../api/conversationApi";
import { deleteAccount } from "../api/userApi";
import { useChat } from "../hooks/chatHook";

type Theme = "dark" | "light";

const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(localStorage.getItem("app-theme") as Theme || "dark");
  const [language, setLanguage] = useState(localStorage.getItem("app-lang")||"en");
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [dialogType, setDialogType] = useState<"clear-history" | "delete-account" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setGroupConversations } = useChat();
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("app-lang", lang);
    setLanguage(lang);
  };
  const handleLogout = () => {
    removeToken();
    setUser(null);
    nav("/");
  };
  const openClearHistoryDialog = () => {
    setDialogType("clear-history");
    setDialogOpen(true);
  };

  const openDeleteAccountDialog = () => {
    setDialogType("delete-account");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
  };

  const handleConfirmDialog = async () => {
      if (dialogType === "clear-history") {
        console.log("Clear chat history");
        const { data, error } = await deleteAllConversations();
        setGroupConversations([]);
        if (data) {
          alert(t("settings.success"));
        }
        if (error) {
          alert(t("settings.failed"));
        }
      }

      if (dialogType === "delete-account") {
        console.log("Delete account");
        const { data, error } = await deleteAccount();
        if (data) {
          localStorage.removeItem("accessToken");
          setUser(null);
          nav("/");
        }
        if (error) {
          alert(t("settings.failed"));
        }
      }

      closeDialog();
  };
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  },[theme])
  return (
    <div className={styles["settings-page"]}>
      <header className={styles["settings-header"]}>
        <div>
          <p className={styles["settings-eyebrow"]}>{t("sidebar.settings")}</p>
          <h1 className={styles["settings-title"]}>{t("settings.title")}</h1>
        </div>
      </header>

      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>👤</span>
          {t("settings.personalInfo")}
        </h2>

        <div className={styles["stack"]}>
          <SettingRow
            icon={<PhoneIcon />}
            title={t("settings.phone")}
            description={user?.fullname}
            actionLabel={t("settings.update")}
            onAction={() => console.log("Update phone")}
          />
          <SettingRow
            icon={<LocationIcon />}
            title={t("settings.address")}
            description={t("settings.address")}
            actionLabel={t("settings.update")}
            onAction={() => console.log("Update address")}
          />
        </div>
      </section>

      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>🎨</span>
          {t("settings.personalization")}
        </h2>

        <div className={styles["personalization-grid"]}>
          <div className={styles["panel"]}>
            <div className={styles["panel-head"]}>
              <p className={styles["panel-eyebrow"]}>{t("settings.theme")}</p>
              <h3 className={styles["panel-title"]}>{t("settings.theme")}</h3>
              <p className={styles["panel-description"]}>
                {t("settings.themeDescription")}
              </p>
            </div>

            <div className={styles["theme-toggle"]}>
              <button
                type="button"
                className={`${styles["theme-option"]} ${
                  theme === "dark" ? styles["selected"] : ""
                }`}
                onClick={() => setTheme("dark")}
              >
                <MoonIcon />
                <span>{t("settings.dark")}</span>
              </button>

              <button
                type="button"
                className={`${styles["theme-option"]} ${
                  theme === "light" ? styles["selected"] : ""
                }`}
                onClick={() => setTheme("light")}
              >
                <SunIcon />
                <span>{t("settings.light")}</span>
              </button>
            </div>
          </div>

          <div className={styles["panel"]}>
            <div className={styles["panel-head"]}>
              <p className={styles["panel-eyebrow"]}>{t("settings.language")}</p>
              <h3 className={styles["panel-title"]}>{t("settings.language")}</h3>
              <p className={styles["panel-description"]}>
                {t("settings.languageDescription")}
              </p>
            </div>

            <label className={styles["select-wrap"]}>
              <select
                className={styles["select"]}
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option>en</option>
                <option>vi</option>
              </select>
              <ChevronDownIcon />
            </label>
          </div>
        </div>
      </section>

      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>🛡️</span>
          {t("settings.security")}
        </h2>

        <div className={styles["stack"]}>
          <SettingRow
            icon={<KeyIcon />}
            title={t("settings.passwordSecurity")}
            description="Last updated 14 days ago. Enable 2FA for better security."
            actionLabel={t("settings.update")}
            onAction={() => setOpenPasswordModal(true)}
          />

          <SettingRow
            icon={<TrashIcon />}
            title={t("settings.clearHistory")}
            description="Permanently delete all your conversation data across the system."
            actionLabel={t("settings.clearHistory")}
            danger
            onAction={openClearHistoryDialog}
          />

          <SettingRow
            icon={<UserMinusIcon />}
            title={t("settings.deleteAccount")}
            description="Permanently remove your account and all associated data. This action cannot be undone."
            actionLabel={t("settings.deleteAccount")}
            destructive
            onAction={openDeleteAccountDialog}
          />

          <SettingRow
            icon={<LogoutIcon />}
            title={t("settings.signOut")}
            description="End your current session and securely log out of the interface."
            actionLabel={t("settings.signOut")}
            onAction={() => handleLogout()}
          />
        </div>
      </section>
      {dialogOpen && (
      <div
        className={styles["dialog-overlay"]}
        onClick={closeDialog}
      >
        <div
          className={styles["dialog"]}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles["dialog-header"]}>
            <h2 className={styles["dialog-title"]}>
              {dialogType === "clear-history"
                ? t("settings.clearHistory")
                : t("settings.deleteAccount")}
            </h2>

            <button
              className={styles["dialog-close"]}
              onClick={closeDialog}
            >
              ×
            </button>
          </div>

          <div className={styles["dialog-body"]}>
            <p className={styles["dialog-text"]}>
              {dialogType === "clear-history"
                ? t("settings.clearHistoryConfirmation")
                : t("settings.deleteAccountConfirmation")}
            </p>
          </div>

          <div className={styles["dialog-footer"]}>
            <button
              className={styles["dialog-cancel"]}
              onClick={closeDialog}
            >
              {t("common.cancel")}
            </button>

            <button
              className={styles["dialog-danger"]}
              onClick={handleConfirmDialog}
            >
              {dialogType === "clear-history"
                ? t("settings.clearHistory")
                : t("settings.deleteAccount")}
            </button>
          </div>
        </div>
      </div>
    )}
      <UpdatePasswordModal
        isOpen={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
        onSubmit={async (formData) => {
                console.log(formData);
                const {data, error, status } = await changePassword(formData);
                if (status === 200) {
                    alert(t("settings.success"));
                    setOpenPasswordModal(false);
                }
                if (error) {
                    alert(error.message);
                }
            }}
      />
    </div>
  );
};

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string | undefined;
  actionLabel: string;
  onAction: () => void;
  danger?: boolean;
  destructive?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  danger = false,
  destructive = false,
}) => {
  const iconClass = `${styles["setting-icon"]} ${
    danger
      ? styles["danger"]
      : destructive
      ? styles["destructive"]
      : ""
  }`;

  const actionClass = `${styles["setting-action"]} ${
    danger
      ? styles["danger"]
      : destructive
      ? styles["destructive"]
      : ""
  }`;

  return (
    <div className={styles["setting-row"]}>
      <div className={iconClass}>{icon}</div>

      <div className={styles["setting-content"]}>
        <h3 className={styles["setting-title"]}>{title}</h3>
        <p className={styles["setting-description"]}>{description}</p>
      </div>

      <button type="button" className={actionClass} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
};

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.52 19.52 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.92.32 1.82.59 2.67a2 2 0 0 1-.45 2.11L8 9.83a16 16 0 0 0 6.17 6.17l1.33-1.24a2 2 0 0 1 2.11-.45c.85.27 1.75.47 2.67.59A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="8" r="3" />
      <path d="M10.5 10.5 21 21" />
      <path d="M16 7h5v5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function UserMinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M16 11h6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

export default SettingsPage;