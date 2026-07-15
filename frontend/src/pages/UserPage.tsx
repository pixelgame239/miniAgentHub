import { useEffect, useState } from "react";
import styles from "../styles/user.module.css";
import UserFormDialog from "../component/UserFormDialog";
import { getAllGroups } from "../api/groupApi";
import { register } from "../api/authApi";
import type { User } from "../loader/userLoader";
import { useLoaderData, useNavigate } from "react-router";
import type { Group } from "../loader/groupLoader";
import { deleteUser, resendVerificationEmail, updateUser } from "../api/userApi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/authHook";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import { SettingsIcon, TrashIcon } from "./GroupsPage";
import ResendEmailConfirmDialog from "../component/ResendEmailConfirmDialog";

const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);
const UserPage = () => {
  const usersLoaded = useLoaderData() as User[];
  const [users, setUsers] = useState(usersLoaded);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletedUser, setDeletedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showInfo, showError, showToast } = useNotificationPopup();
  const [submitting, setSubmitting] = useState(false);
  const [resendEmailUser, setResendEmailUser] = useState<User | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const nav = useNavigate();
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "dark");
  },[]);
  useEffect(() => {
    if (user && !user.permissions?.includes("USER_R")) {
      nav("/chat");
    }
  }, [user, nav]);

  const openCreateDialog = async () => {
    const response = await getAllGroups();
    setGroups(response.data || []);
    console.log(response.data);
    setDialogMode("create");
  };

  const openEditDialog = async(user: User) => {
    const response = await getAllGroups();
    setGroups(response.data||[]);
    setEditingUser(user);
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingUser(null);
  };
  const openDeleteDialog = (user: User) => {
    setDeletedUser(user);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletedUser(null);
  };
  const handleResendEmail = async () => {
    if (!resendEmailUser) return;
    
    // Đóng dialog trước
    setResendSubmitting(true);
    const { data, error } = await resendVerificationEmail(resendEmailUser.id, resendEmailUser.email, resendEmailUser.fullname, localStorage.getItem("app-lang") || "vi");
    if (data) {
      showToast(t("common.success"), "success");
    }
    if (error) {
      showError(t("common.failed"+":"+error.message));
      console.error(error);
    }
    setResendSubmitting(false);
    setResendDialogOpen(false);
    setResendEmailUser(null);
  };
  const handleFormSubmit = async (formData: {
    email: string;
    fullname: string;
    groups: Group[];
  }) => {
    setSubmitting(true);
    if (dialogMode === "create") {
      const { data, error } = await register({...formData, lang: localStorage.getItem("app-lang") || "vi"});
      if(data){
        setUsers([...users,data.userData]);
        showInfo(t("users.sendEmail"));
      }
      if(error){
        showError(t("common.failed"+":"+error.message));
        console.error(error);
      }
    } else{
        const { data, error } = await updateUser(formData, editingUser?.id);
        const updatedUser = data;
        if (error) {
          showError(t("common.failed"+":"+error.message));
          console.error(error);
          return;
        }
        if(updatedUser){
        showToast(t("common.success"), "success");
        setUsers(prevUsers => 
            prevUsers.map(user => 
                user.id === editingUser?.id ? updatedUser : user
            )
        );
      }
      }
    setSubmitting(false);
    closeDialog();
  };
  const handledeletedUser = async () => {
    if (!deletedUser) return;
    const { data, error } = await deleteUser(deletedUser.id);
    if (data) {
      showToast(t("common.success"), "success");
    }
    if (error) {
      showError(t("common.failed"+":"+error.message));
      console.error(error);
      return;
    }

    setUsers((prev) =>
      prev.filter((user) => user.id !== deletedUser.id)
    );
    closeDeleteDialog();
  };
  return (
    <div className={styles.userContent}>
      <header className={styles.userHeader}>
        <div>
          <h1>{t("users.title")}</h1>

          <p className={styles.userDescription}>
            {t("users.description")}
          </p>
        </div>
        {user?.permissions?.includes("USER_C") && (
          <button
            className={styles.addUserBtn}
            onClick={openCreateDialog}
          >
            {t("users.addUser")}
          </button>
        )}
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>
                ID
              </th>

              <th>{t("users.fullName")}</th>
              <th>{t("users.email")}</th>
              <th>{t("users.groups")}</th>
              <th className={styles.actionsCol}>{t("groups.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {users.map((sing) => (
              <tr
                key={sing.id}
                className={
                  selectedIds.includes(sing.id)
                    ? `${styles.userRow} ${styles.selectedRow}`
                    : styles.userRow
                }
              >
                {/* Thêm class responsive riêng cho ô checkbox */}
                <td data-label="ID">
                  {sing.id}
                </td>

                {/* Thêm data-label tương ứng với thẻ dịch t() */}
                <td data-label={t("users.fullName")}>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {sing.fullname
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span>{sing.fullname}</span>
                  </div>
                </td>

                <td data-label={t("users.email")}>{sing.email}</td>

                <td data-label={t("users.groups")}>
                  <div className={styles.groupList}>
                    {sing.groups.map((group) => (
                      <span
                        key={group.id}
                        className={styles.groupBadge}
                      >
                        {group.groupName}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Ô hành động gán class riêng cho mobile */}
                <td className={`${styles.actionsCol} ${styles.mobileActions}`}>
                  <div className={styles.actions}>
                    {user?.groups?.find((g) => g.groupName === "ADMIN") && !sing.active && (
                      <button
                        className={`${styles.actionBtn} ${styles.resetPwdBtn}`}
                        title={t("users.resetPassword")}
                        onClick={() => {
                          setResendEmailUser(sing);
                          setResendDialogOpen(true);
                        }}
                      >
                        <KeyIcon />
                      </button>
                    )}
                    {user?.permissions?.includes("USER_U") && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditDialog(sing)}
                      >
                        <SettingsIcon />
                      </button>
                    )}

                    {user?.permissions?.includes("USER_D") && (
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => openDeleteDialog(sing)}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogMode && (
        <UserFormDialog
          mode={dialogMode}
          initialData={
            editingUser
              ? {
                  fullname: editingUser.fullname,
                  email: editingUser.email,
                  groups: editingUser.groups,
                }
              : undefined
          }
          onClose={closeDialog}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          groups={groups}
        />
      )}
      {deleteDialogOpen && (
        <div
          className={styles.dialogOverlay}
          onClick={closeDeleteDialog}
        >
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dialogHeader}>
              <h2>{t("users.deletedUser")} {deletedUser?.email}</h2>

              <button
                className={styles.dialogCloseBtn}
                onClick={closeDeleteDialog}
              >
                ×
              </button>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.dialogText}>
                {t("users.deleteConfirmation")}{" "}
                <strong>{deletedUser?.fullname}</strong>?
              </p>

              <p className={styles.dialogWarning}>
                {t("users.deleteWarning")}
              </p>
            </div>

            <div className={styles.dialogFooter}>
              <button
                className={styles.cancelBtn}
                onClick={closeDeleteDialog}
              >
                {t("common.cancel")}
              </button>

              <button
                className={styles.confirmDeleteBtn}
                onClick={handledeletedUser}
              >
                {t("users.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
      <ResendEmailConfirmDialog
        isOpen={resendDialogOpen}
        user={resendEmailUser}
        submitting={resendSubmitting} // <-- Truyền state vào đây
        onClose={() => {
          // Chỉ cho phép đóng dialog thủ công khi không trong quá trình gửi
          if (!resendSubmitting) {
            setResendDialogOpen(false);
            setResendEmailUser(null);
          }
        }}
        onConfirm={handleResendEmail}
      />
    </div>
  );
};

export default UserPage;