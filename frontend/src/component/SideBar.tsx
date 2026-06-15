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

type ConversationItem = {
  id: number;
  title: string;
};

const Sidebar = () => {
  const { AIModels, conversations } = useRouteLoaderData("layout-data-loader") as {
    AIModels: AIModels[];
    conversations: Conversation[];
  };
  const { currentConversation, setCurrentConversation, groupConversations, setGroupConversations } =
    useChat();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModels | null>(AIModels[0] ?? null);
  const { t } = useTranslation();
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { user } = useAuth();
  const { showError , showInfo } = useNotificationPopup();
  const nav = useNavigate();
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
    nav("/chat");
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
      showInfo(t("common.success"));
    }
    if(error){
      showError(t("common.failed") + ": " + error.message);
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

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    const { data, error } = await deleteConversation(activeConversation.id);
    if(data){
      showInfo(t("common.success"));
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
    <aside className={styles.sidebar}>
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
                        <button
                          className={styles.chatActionMenuItem}
                          onClick={() => openEditDialog(chat)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.chatActionMenuItem} ${styles.chatActionMenuItemDanger}`}
                          onClick={() => openDeleteDialog(chat)}
                        >
                          Delete
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
            <h4>No conversations yet</h4>
            <p>Create your first chat to get started.</p>
          </div>
        )}
      </div>

      {/* EDIT / DELETE DIALOG */}
      <ReusableDialog
        open={dialogOpen}
        title={dialogMode === "edit" ? "Edit conversation" : "Delete conversation"}
        onClose={closeDialog}
        footer={
          dialogMode === "edit" ? (
            <>
              <button className={styles.cancelBtn} onClick={closeDialog}>
                Cancel
              </button>
              <button className={styles.createBtn} onClick={handleEditConversation}>
                Save changes
              </button>
            </>
          ) : (
            <>
              <button className={styles.cancelBtn} onClick={closeDialog}>
                Cancel
              </button>
              <button className={styles.dangerBtn} onClick={handleDeleteConversation}>
                Delete
              </button>
            </>
          )
        }
      >
        {dialogMode === "edit" ? (
          <div className={styles.formGroup}>
            <label>Conversation title</label>
            <input
              className={styles.formInput}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter conversation title"
            />
          </div>
        ) : (
          <p className={styles.deleteText}>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </p>
        )}
      </ReusableDialog>

      {/* NEW CHAT MODAL */}
      {showNewChatModal && (
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
      )}

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