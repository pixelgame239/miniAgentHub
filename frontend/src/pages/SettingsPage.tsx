// pages/SettingsPage.tsx
import React, { useEffect, useState } from "react";
import styles from "../styles/settings.module.css"; 
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/authHook";
import { removeToken } from "../api/apiClient";
import UpdatePasswordModal from "../component/UpdatePasswordModal";
import { changePassword } from "../api/authApi";
import { useTranslation } from "react-i18next";
import { deleteAllConversations } from "../api/conversationApi";
import { deleteAccount, updateAddress, updatePhoneNumber } from "../api/userApi";
import { useChat } from "../hooks/chatHook";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import { getGroqModels } from "../api/aiApi";

type Theme = "dark" | "light";
// Mở rộng thêm trường APIKey vào danh sách có thể chỉnh sửa trực tiếp qua Dialog
type EditableField = "phoneNumber" | "address" | "APIKey";

const isValidPhoneNumber = (value: string) => /^0\d{9,10}$/.test(value);

const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(localStorage.getItem("app-theme") as Theme || "dark");
  const [language, setLanguage] = useState(localStorage.getItem("app-lang")||"vi");
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState(""); // State lưu lỗi mật khẩu cũ sai
  
  const [editableField, setEditableField] = useState<EditableField | null>(null);
  const [editableValue, setEditableValue] = useState("");
  const [phoneError, setPhoneError] = useState(""); // State báo lỗi inline cho riêng số điện thoại
  const [savingField, setSavingField] = useState(false);
  
  const [dialogType, setDialogType] = useState<"clear-history" | "delete-account" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { setGroupConversations } = useChat();
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { showError, showToast } = useNotificationPopup();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("app-lang", lang);
    setLanguage(lang);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    localStorage.removeItem("APIKey"); 
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

  const openFieldDialog = (field: EditableField) => {
    setEditableField(field);
    setPhoneError(""); // Reset lỗi cũ
    if (field === "phoneNumber") setEditableValue(user?.phoneNumber ?? "");
    else if (field === "address") setEditableValue(user?.address ?? "");
    else if (field === "APIKey") setEditableValue("");
  };

  const closeFieldDialog = () => {
    setEditableField(null);
    setEditableValue("");
    setPhoneError("");
    setSavingField(false);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
  };

  const handleSaveField = async () => {
    if (!editableField) return;

    const nextValue = editableValue.trim();

    if (!nextValue) {
      setPhoneError(t("settings.emptyError"));
      return;
    }

    // Xử lý riêng logic Số điện thoại
    if (editableField === "phoneNumber") {
      const normalizedPhoneNumber = nextValue.replace(/\s+/g, "");

      if (!isValidPhoneNumber(normalizedPhoneNumber)) {
        setPhoneError(t("settings.invalidPhone")); // Đưa lỗi vào dòng chữ đỏ inline dưới input
        return;
      }

      setSavingField(true);
      try {
        if (!user?.id) return;
        const { data, error } = await updatePhoneNumber(normalizedPhoneNumber, user.id);
        if (error) {
          setPhoneError(t("common.failed"));
          return;
        }
        if (data) {
          setUser((prev) => (prev ? { ...prev, phoneNumber: normalizedPhoneNumber } : prev));
          showToast(t("common.success"), "success"); // Lưu thành công bắn Toast thông báo nhẹ nhàng
          closeFieldDialog();
        }
      } catch (error) {
        setPhoneError(t("common.failed"));
      } finally {
        setSavingField(false);
      }
      return;
    }

    // Xử lý riêng logic cập nhật API Key
    // if (editableField === "APIKey") {
    //   setSavingField(true);
    //   const {data, error} = await getGroqModels(nextValue);
    //   if(data){
    //     localStorage.setItem("APIKey", nextValue);
    //     const { data:updateAPIKeyData, error:updateAPIKeyError } = await updateUserAPIKey(nextValue, user?.id);
    //     if(updateAPIKeyError){
    //       setPhoneError(t("common.failed"));
    //       return;
    //     }
    //     showToast(t("common.success"), "success");
    //     closeFieldDialog();
    //     setSavingField(false);
    //   }
    //   if(error){
    //     setPhoneError(t("initAPIKey.errorMessage"));
    //     setSavingField(false);
    //   }
    //   return;
    // }

    // Xử lý logic Địa chỉ
    setSavingField(true);
    try {
      if (!user?.id) return;
      if (editableField === "address") {
        const { data, error } = await updateAddress(nextValue, user.id);
        if (error) {
          setPhoneError(t("common.failed"));
          return;
        }
        if (data) {
          setUser((prev) => (prev ? { ...prev, address: nextValue } : prev));
          showToast(t("common.success"), "success");
          closeFieldDialog();
        }
      }
    } catch (error) {
      setPhoneError(t("common.failed"));
    } finally {
      setSavingField(false);
    }
  };

  const handleConfirmDialog = async () => {
      if (dialogType === "clear-history") {
        const { data, error } = await deleteAllConversations();
        setGroupConversations([]);
        if (data) showToast(t("common.success"), "success");
        if (error) showError(t("common.failed"));
      }

      if (dialogType === "delete-account") {
        const { data, error } = await deleteAccount();
        if (data) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("APIKey");
          setUser(null);
          nav("/");
        }
        if (error) showError(t("common.failed"));
      }
      closeDialog();
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  return (
    <div className={styles["settings-page"]}>
      <header className={styles["settings-header"]}>
        <div>
          <p className={styles["settings-eyebrow"]}>{t("sidebar.settings")}</p>
          <h1 className={styles["settings-title"]}>{t("settings.title")}</h1>
        </div>
      </header>

      {/* SECTION 1: PERSONAL INFO */}
      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>👤</span>
          {t("settings.personalInfo")}
        </h2>

        <div className={styles["stack"]}>
          <SettingRow
            icon={<PhoneIcon />}
            title={t("settings.phone")}
            description={user?.phoneNumber}
            actionLabel={t("settings.update")}
            onAction={() => openFieldDialog("phoneNumber")}
          />
          <SettingRow
            icon={<LocationIcon />}
            title={t("settings.address")}
            description={user?.address}
            actionLabel={t("settings.update")}
            onAction={() => openFieldDialog("address")}
          />
        </div>
      </section>

      {/* SECTION 2: PERSONALIZATION */}
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
              <p className={styles["panel-description"]}>{t("settings.themeDescription")}</p>
            </div>

            <div className={styles["theme-toggle"]}>
              <button
                type="button"
                className={`${styles["theme-option"]} ${theme === "dark" ? styles["selected"] : ""}`}
                onClick={() => setTheme("dark")}
              >
                <MoonIcon />
                <span>{t("settings.dark")}</span>
              </button>

              <button
                type="button"
                className={`${styles["theme-option"]} ${theme === "light" ? styles["selected"] : ""}`}
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
              <p className={styles["panel-description"]}>{t("settings.languageDescription")}</p>
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

      {/* SECTION 3: SECURITY */}
      <section className={styles["settings-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["section-icon"]}>🛡️</span>
          {t("settings.security")}
        </h2>

        <div className={styles["stack"]}>
          <SettingRow
            icon={<KeyIcon />}
            title={t("settings.passwordSecurity")}
            description={t("settings.passwordDescription")}
            actionLabel={t("settings.update")}
            onAction={() => {
              setPasswordError(""); // Reset lỗi mật khẩu cũ trước khi mở
              setOpenPasswordModal(true);
            }}
          />

          {/* VÙNG THAY THẾ API KEY MỚI THÊM */}
          {/* <SettingRow
            icon={<CodeIcon />}
            title="Groq API Key"
            description={localStorage.getItem("APIKey") ? "••••••••••••" + localStorage.getItem("APIKey")?.slice(-4) : t("settings.noAPIKey")}
            actionLabel={t("settings.update")}
            onAction={() => openFieldDialog("APIKey")}
          /> */}

          <SettingRow
            icon={<TrashIcon />}
            title={t("settings.clearHistory")}
            description={t("settings.deleteChatDescription")}
            actionLabel={t("settings.clearHistory")}
            danger
            onAction={openClearHistoryDialog}
          />

          <SettingRow
            icon={<UserMinusIcon />}
            title={t("settings.deleteAccount")}
            description={t("settings.deleteAccountDescription")}
            actionLabel={t("settings.deleteAccount")}
            destructive
            onAction={openDeleteAccountDialog}
          />

          <SettingRow
            icon={<LogoutIcon />}
            title={t("settings.signOut")}
            description={t("settings.logoutDescription")}
            actionLabel={t("settings.signOut")}
            onAction={() => handleLogout()}
          />
        </div>
      </section>

      {/* EDITABLE FIELD DIALOG (SĐT / ĐỊA CHỈ / API KEY) */}
      {editableField && (
        <div className={styles["dialog-overlay"]} onClick={closeFieldDialog}>
          <div className={styles["dialog"]} onClick={(e) => e.stopPropagation()}>
            <div className={styles["dialog-header"]}>
              <h2 className={styles["dialog-title"]}>
                {editableField === "phoneNumber" && t("settings.phone")}
                {editableField === "address" && t("settings.address")}
                {editableField === "APIKey" && t("settings.updateAPIKey")}
              </h2>
              <button className={styles["dialog-close"]} onClick={closeFieldDialog}>×</button>
            </div>

            <div className={styles["dialog-body"]}>
              <div className={styles["dialog-field"]}>
                <label className={styles["dialog-label"]}>
                  {editableField === "phoneNumber" && t("settings.phone")}
                  {editableField === "address" && t("settings.address")}
                  {editableField === "APIKey" && t("settings.updateAPIKey")}
                </label>
                <input
                  className={`${styles["dialog-input"]} ${phoneError ? styles["input-error"] : ""}`}
                  value={editableValue}
                  type={editableField === "APIKey" ? "password" : "text"}
                  onChange={(event) => {
                    setEditableValue(event.target.value);
                    if (phoneError) setPhoneError(""); // User gõ lại thì xóa chữ đỏ báo lỗi mượt mà chuẩn UX
                  }}
                  placeholder={editableField === "APIKey" ? t("initAPIKey.inputPlaceholder") : ""}
                  required
                />
                {/* DÒNG BÁO LỖI CHỮ ĐỎ INLINE DƯỚI INPUT DIALOG */}
                {phoneError && <span className={styles["dialog-error-msg"]}>{phoneError}</span>}
              </div>
            </div>

            <div className={styles["dialog-footer"]}>
              <button className={styles["dialog-cancel"]} onClick={closeFieldDialog}>
                {t("common.cancel")}
              </button>
              <button className={styles["dialog-save-btn"]} onClick={handleSaveField} disabled={savingField}>
                {savingField ? "Saving..." : t("settings.update")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG XÁC NHẬN CLEAR HISTORY / DELETE ACCOUNT */}
      {dialogOpen && (
        <div className={styles["dialog-overlay"]} onClick={closeDialog}>
          <div className={styles["dialog"]} onClick={(e) => e.stopPropagation()}>
            <div className={styles["dialog-header"]}>
              <h2 className={styles["dialog-title"]}>
                {dialogType === "clear-history" ? t("settings.clearHistory") : t("settings.deleteAccount")}
              </h2>
              <button type="button" className={styles["dialog-close"]} onClick={closeDialog}>×</button>
            </div>
            <div className={styles["dialog-body"]}>
              <p className={styles["dialog-text"]}>
                {dialogType === "clear-history" ? t("settings.clearHistoryConfirmation") : t("settings.deleteAccountConfirmation")}
              </p>
            </div>
            <div className={styles["dialog-footer"]}>
              <button type="button" className={styles["dialog-cancel"]} onClick={closeDialog}>
                {t("common.cancel")}
              </button>
              <button type="button" className={styles["dialog-danger"]} onClick={handleConfirmDialog}>
                {dialogType === "clear-history" ? t("settings.clearHistory") : t("settings.deleteAccount")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PASSWORD MODAL */}
      <UpdatePasswordModal
        isOpen={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
        error={passwordError}
        onSubmit={async (formData) => {
          const { data, error } = await changePassword(formData);
          if (data) {
            showToast(t("password.successChange"), "success"); // Thành công chỉ dùng Toast thông báo, tắt modal
            setOpenPasswordModal(false);
          }
          if (error) {
            // Nếu API báo mật khẩu cũ sai, set chữ đỏ ngay dưới input của modal
            setPasswordError(t("password.wrongOldPassword"));
          }
        }}
      />
    </div>
  );
};
function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
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