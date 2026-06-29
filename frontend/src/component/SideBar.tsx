// Sidebar.tsx
import { NavLink, useNavigate, useRouteLoaderData } from "react-router";
import { useEffect, useState, useRef } from "react"; // Thêm useRef ở đây
import { useAuth } from "../hooks/authHook";
import styles from "../styles/sidebar.module.css";
import { useChat } from "../hooks/chatHook";
import {
  deleteConversation,
  getConversationDetail,
  updateConversationTitle,
} from "../api/conversationApi";
import type { AIModels } from "../loader/aiLoader";
import { useTranslation } from "react-i18next";
import ReusableDialog from "./ReusableDialogProps";
import type { Conversation } from "../loader/groupLoader";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import { shareConversation } from "../api/shareApi";
import { exportAllMessages } from "../api/exportApi";
import ExportModal from "./ExportModal";
import { generateDocx, generatePdf } from "../utils/export";

type ConversationItem = {
  id: number;
  title: string;
};
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const { conversations } = useRouteLoaderData("layout-data-loader") as {
    conversations: Conversation[];
  };
  const { currentConversation, setCurrentConversation, groupConversations, setGroupConversations } =
    useChat();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const { t } = useTranslation();
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { user } = useAuth();
  const { showError, showToast, showInfo } = useNotificationPopup();
  const nav = useNavigate();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const curTheme = localStorage.getItem("app-theme") || "light";
  const [exportID, setExportID] = useState<number | null>(null);
  // Tạo ref để theo dõi vùng bao quanh danh sách menu hành động
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setGroupConversations(conversations);
  }, [conversations, setGroupConversations]);

  // SỬA ĐỔI: Xử lý click outside đóng menu ba chấm
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };

    // Đăng ký sự kiện khi menu đang mở
    if (menuOpenId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId]);

  const openConversation = async (convId: number) => {
    if(onClose) onClose(); // Đóng sidebar nếu đang ở chế độ mobile
    const {data, error} = await getConversationDetail(convId);
    if (data) {
      setCurrentConversation(data);
    }
    if(error){
      showError(error.message);
    }
    nav("/chat");
  };

  const handleCreateNewChat = () => {
    setCurrentConversation(null);
    if(onClose) onClose(); // Đóng sidebar nếu đang ở chế độ mobile
    nav("/chat");
  };
  const handleShareConversation = async (conversationId: number) => {
    const { data, error } = await shareConversation(conversationId);
    if (data) {
      showInfo(t("common.success") + ": " + window.location.origin + data);
    }
    if (error) {
      showError(t("common.failed"));
      console.error("Failed to share conversation:", error);
    }
  };

  const openEditDialog = (chat: ConversationItem) => {
    setActiveConversation(chat);
    setEditTitle(chat.title);
    setDialogMode("edit");
    setDialogOpen(true);
    setMenuOpenId(null);
  };

  const openDeleteDialog = (chat: ConversationItem) => {
    setActiveConversation(chat);
    setDialogMode("delete");
    setDialogOpen(true);
    setMenuOpenId(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setActiveConversation(null);
    setEditTitle("");
  };

  const handleEditConversation = async () => {
    if (!activeConversation) return;
    const nextTitle = editTitle.trim();
    if (!nextTitle) return;
    const { data, error} = await updateConversationTitle(activeConversation.id, nextTitle);
    if(data){
      showToast(t("common.success"), "success");
    }
    if(error){
      showError(t("common.failed"));
      console.error("Failed to update conversation title:", error);
      return;
    }
    setGroupConversations((prev) =>
      prev.map((item) =>
        item.id === activeConversation.id ? { ...item, title: nextTitle } : item
      )
    );
    if (currentConversation?.id === activeConversation.id) {
      setCurrentConversation((prev: any) => (prev ? { ...prev, title: nextTitle } : prev));
    }
    closeDialog();
  };
  const handleOpenExport = (conversationId: number) => {
    setIsExportOpen(true);
    setExportID(conversationId);
  };
  const handleExport = async (format: "docx" | "pdf") => {
    if (exportID === null) return;
    const { data, error } = await exportAllMessages(exportID);
    if (data) {
      if (format === "docx") {
        await generateDocx(data);
      } else if (format === "pdf") {
        await generatePdf(data);
      }
      showToast(t("common.success"), "success");
      setIsExportOpen(false);
    }
    if (error) {
      showError(t("common.failed"));
    }
  }
  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    const { data, error } = await deleteConversation(activeConversation.id);
    if(data){
      showToast(t("common.success"), "success");
    }
    if (error) {
      showError(t("common.failed") + ": " + error.message);
      return;
    }
    setGroupConversations((prev) => prev.filter((item) => item.id !== activeConversation.id));
    if (currentConversation?.id === activeConversation.id) {
      setCurrentConversation(null);
    }
    closeDialog();
  };

  const navItems = [
    {
      to: "/chat",
      label: t("sidebar.chat"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: "/user",
      label: t("sidebar.users"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      to: "/groups",
      label: t("sidebar.groups"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3z" />
        </svg>
      ),
    },
    {
      to: "/settings",
      label: t("sidebar.settings"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82V9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l-.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarMobileOpen : ""}`}>
      {/* HEADER */}
      <header className={styles.sidebarHeader}>
        <div className={styles.appTitle}>
          <span className={styles.appIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className={styles.appName}>Agent Hub</span>
        </div>

        {/* Nút Đóng nhanh Sidebar chỉ lộ diện trên Mobile */}
        <button className={styles.sidebarCloseBtn} onClick={onClose} aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>
      {/* NAVIGATION */}
      <nav className={styles.sidebarNav}>
        {user &&
          navItems
            .filter((item) => {
              if (item.label === t("sidebar.users") && !user.userAccess) return false;
              if (item.label === t("sidebar.groups") && !user.groupAccess) return false;
              return true;
            })
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
                onClick={onClose} // Đóng sidebar khi click vào link (chỉ có tác dụng trên mobile)
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
      </nav>

      <div className={styles.sidebarDivider} />

      {/* CHAT SECTION */}
      <div className={styles.chatSection}>
        <button className={styles.newConversationBtn} onClick={() => handleCreateNewChat()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("sidebar.newChat")}
        </button>

        {groupConversations.length > 0 ? (
          <>
            <span className={styles.chatListLabel}>{t("sidebar.recent") ?? "Recent"}</span>
            {/* Gắn ref vào bọc danh sách chat để lắng nghe click outside */}
            <div className={styles.chatList} ref={menuRef}>
              {groupConversations.map((chat) => (
                <div key={chat.id} className={styles.chatRow}>
                  <button
                    className={`${styles.chatItemBtn} ${
                      currentConversation?.id === chat.id ? styles.chatItemActive : ""
                    }`}
                    onClick={async () => await openConversation(chat.id)}
                  >
                    <span className={styles.chatIcon}>💬</span>
                    <span className={styles.chatItemTitle}>{chat.title}</span>
                  </button>

                  <div className={styles.chatActionsWrap}>
                    <button
                      className={styles.chatActionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((prev) => (prev === chat.id ? null : chat.id));
                      }}
                      aria-label="Conversation actions"
                    >
                      ⋯
                    </button>

                    {menuOpenId === chat.id && (
                      <div
                        className={styles.chatActionMenu}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className={styles.chatActionMenuItem} onClick={async() => await handleShareConversation(chat.id)}>
                          <div>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill={curTheme==="dark" ? "#fff": "#000"}><path d="M648-96q-50 0-85-35t-35-85q0-9 4-29L295-390q-16 14-36.05 22-20.04 8-42.95 8-50 0-85-35t-35-85q0-50 35-85t85-35q23 0 43 8t36 22l237-145q-2-7-3-13.81-1-6.81-1-15.19 0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-23 0-43-8t-36-22L332-509q2 7 3 13.81 1 6.81 1 15.19 0 8.38-1 15.19-1 6.81-3 13.81l237 145q16-14 36.05-22 20.04-8 42.95-8 50 0 85 35t35 85q0 50-35 85t-85 35Zm0-72q20.4 0 34.2-13.8Q696-195.6 696-216q0-20.4-13.8-34.2Q668.4-264 648-264q-20.4 0-34.2 13.8Q600-236.4 600-216q0 20.4 13.8 34.2Q627.6-168 648-168ZM216-432q20.4 0 34.2-14 13.8-14 13.8-34t-13.8-34q-13.8-14-34.2-14-20.4 0-34.2 14-13.8 14-13.8 34t13.8 34q13.8 14 34.2 14Zm466-277.8q14-13.8 14-34.2 0-20.4-13.8-34.2Q668.4-792 648-792q-20.4 0-34.2 13.8Q600-764.4 600-744q0 20.4 14 34.2 14 13.8 34 13.8t34-13.8ZM648-216ZM216-480Zm432-264Z"/></svg>
                            {t("sidebar.share")}
                          </div>
                        </button>
                        <button
                          className={styles.chatActionMenuItem}
                          onClick={() => openEditDialog(chat)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill={curTheme==="dark" ? "#fff": "#000"}><path d="M216-216h51l375-375-51-51-375 375v51Zm-72 72v-153l498-498q11-11 23.84-16 12.83-5 27-5 14.16 0 27.16 5t24 16l51 51q11 11 16 24t5 26.54q0 14.45-5.02 27.54T795-642L297-144H144Zm600-549-51-51 51 51Zm-127.95 76.95L591-642l51 51-25.95-25.05Z"/></svg>
                          {t("sidebar.rename")}
                        </button>
                        <button className={styles.chatActionMenuItem}
                        onClick={()=> handleOpenExport(chat.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill={curTheme==="dark" ? "#fff": "#000"}><path d="M444-336v-342L339-573l-51-51 192-192 192 192-51 51-105-105v342h-72ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72h432v-72h72v72q0 29.7-21.16 50.85Q725.68-192 695.96-192H263.72Z"/></svg>
                          {t("sidebar.export")}
                        </button>
                        <button
                          className={`${styles.chatActionMenuItem} ${styles.chatActionMenuItemDanger}`}
                          onClick={() => openDeleteDialog(chat)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#ff0000"><path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z"/></svg>
                          {t("sidebar.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyChats}>
            <div className={styles.emptyIcon}>💬</div>
            <h4>{t("sidebar.noRecent")}</h4>
            <p>{t("sidebar.createNew")}</p>
          </div>
        )}
      </div>

      {/* EDIT / DELETE DIALOG */}
      <ReusableDialog
        open={dialogOpen}
        title={dialogMode === "edit" ? t("sidebar.rename") : t("sidebar.deleteTitle")}
        onClose={closeDialog}
        footer={
          dialogMode === "edit" ? (
            <>
              <button className={styles.cancelBtn} onClick={closeDialog}>
                {t("common.cancel")}
              </button>
              <button className={styles.createBtn} onClick={handleEditConversation}>
                {t("common.save")}
              </button>
            </>
          ) : (
            <>
              <button className={styles.cancelBtn} onClick={closeDialog}>
                {t("common.cancel")}
              </button>
              <button className={styles.dangerBtn} onClick={handleDeleteConversation}>
                {t("sidebar.delete")}
              </button>
            </>
          )
        }
      >
        {dialogMode === "edit" ? (
          <div className={styles.formGroup}>
            <label>{t("sidebar.conversationTitle")}</label>
            <input
              className={styles.formInput}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={t("sidebar.enterConversationTitle")}
            />
          </div>
        ) : (
          <p className={styles.deleteText}>
            {t("sidebar.deleteConfirmation")}
          </p>
        )}
      </ReusableDialog>
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        onExport={async (format: "docx" | "pdf") => await handleExport(format)}
      />

      {/* NEW CHAT MODAL */}
      {/* {showNewChatModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewChatModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{t("sidebar.newConversation")}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setShowNewChatModal(false)}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>{t("sidebar.conversationTitle")}</label>
                <input
                  type="text"
                  placeholder={t("sidebar.enterConversationTitle")}
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t("sidebar.aiModel")}</label>
                <select
                  value={selectedModel?.id}
                  onChange={(e) => setSelectedModel({ id: e.target.value })}
                  className={styles.formSelect}
                >
                  {AIModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowNewChatModal(false)}>
                {t("common.cancel")}
              </button>
              <button className={styles.createBtn} onClick={handleCreateNewChat}>
                {t("sidebar.createChat")}
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* FOOTER */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.fullname}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;