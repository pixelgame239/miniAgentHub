// pages/SettingsPage.tsx
import React, { useState } from "react";
import styles from "../styles/settings.module.css"; // Changed to CSS Module
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/authHook";
import { removeToken } from "../api/apiClient";
import UpdatePasswordModal from "../component/UpdatePasswordModal";
import { changePassword } from "../api/authApi";

type Theme = "dark" | "light";

const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState<Theme>("dark");
  const [language, setLanguage] = useState("English (US)");
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const handleLogout = () => {
    removeToken();
    setUser(null);
    nav("/");
  };

  return (
    <div className={styles["settings-page"]}>
      <header className={styles["settings-header"]}>
        <div>
          <p className={styles["settings-eyebrow"]}>Settings</p>
          <h1 className={styles["settings-title"]}>Account & Preferences</h1>
        </div>
      </header>

      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>👤</span>
          Personal Information
        </h2>

        <div className={styles["stack"]}>
          <SettingRow
            icon={<PhoneIcon />}
            title="Phone Number"
            description={user?.fullname}
            actionLabel="Update"
            onAction={() => console.log("Update phone")}
          />
          <SettingRow
            icon={<LocationIcon />}
            title="Address"
            description="123 Digital Way, Silicon Valley, CA"
            actionLabel="Update"
            onAction={() => console.log("Update address")}
          />
        </div>
      </section>

      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>🎨</span>
          Personalization
        </h2>

        <div className={styles["personalization-grid"]}>
          <div className={styles["panel"]}>
            <div className={styles["panel-head"]}>
              <p className={styles["panel-eyebrow"]}>VISUAL STYLE</p>
              <h3 className={styles["panel-title"]}>Interface Theme</h3>
              <p className={styles["panel-description"]}>
                Adjust the workspace appearance to reduce eye strain or match
                your lighting environment.
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
                <span>Dark</span>
              </button>

              <button
                type="button"
                className={`${styles["theme-option"]} ${
                  theme === "light" ? styles["selected"] : ""
                }`}
                onClick={() => setTheme("light")}
              >
                <SunIcon />
                <span>Light</span>
              </button>
            </div>
          </div>

          <div className={styles["panel"]}>
            <div className={styles["panel-head"]}>
              <p className={styles["panel-eyebrow"]}>GLOBAL</p>
              <h3 className={styles["panel-title"]}>Language</h3>
              <p className={styles["panel-description"]}>
                Set your preferred communication language.
              </p>
            </div>

            <label className={styles["select-wrap"]}>
              <select
                className={styles["select"]}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>English (US)</option>
                <option>Tiếng Việt (VN)</option>
              </select>
              <ChevronDownIcon />
            </label>
          </div>
        </div>
      </section>

      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>🛡️</span>
          Account & Security
        </h2>

        <div className={styles["stack"]}>
          <SettingRow
            icon={<KeyIcon />}
            title="Password & Security"
            description="Last updated 14 days ago. Enable 2FA for better security."
            actionLabel="Update"
            onAction={() => setOpenPasswordModal(true)}
          />

          <SettingRow
            icon={<TrashIcon />}
            title="Clear Chat History"
            description="Permanently delete all your conversation data across the system."
            actionLabel="Clear"
            danger
            onAction={() => console.log("Clear chat history")}
          />

          <SettingRow
            icon={<UserMinusIcon />}
            title="Delete Account"
            description="Permanently remove your account and all associated data. This action cannot be undone."
            actionLabel="Delete"
            destructive
            onAction={() => console.log("Delete account")}
          />

          <SettingRow
            icon={<LogoutIcon />}
            title="Sign Out"
            description="End your current session and securely log out of the interface."
            actionLabel="Sign Out"
            onAction={() => handleLogout()}
          />
        </div>
      </section>
      <UpdatePasswordModal
        isOpen={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
        onSubmit={async (formData) => {
            try{
                console.log(formData);
                const response = await changePassword(formData);
                alert(response.data);
            } catch(error:any){
                console.log(error);
                alert(error.message)
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