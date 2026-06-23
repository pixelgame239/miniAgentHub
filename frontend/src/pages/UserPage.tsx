import { useEffect, useState } from "react";
import styles from "../styles/user.module.css";
import UserFormDialog from "../component/UserFormDialog";
import { getAllGroups } from "../api/groupApi";
import { register } from "../api/authApi";
import type { User } from "../loader/userLoader";
import { useLoaderData, useNavigate } from "react-router";
import type { Group } from "../loader/groupLoader";
import { deleteUser, updateUser } from "../api/userApi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/authHook";
import { useNotificationPopup } from "../context/NotificationPopupContext";
import { SettingsIcon, TrashIcon } from "./GroupsPage";


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
  const nav = useNavigate();
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", localStorage.getItem("app-theme") || "dark");
  },[]);
  useEffect(() => {
    if (user && !user.userAccess) {
      nav("/chat");
    }
  }, [user, nav]);

  const openCreateDialog = async () => {
    const response = await getAllGroups();
    setGroups(response.data || []);
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
  const handleFormSubmit = async (formData: {
    email: string;
    fullname: string;
    groups: number[];
  }) => {
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
  // const toggleSelectAll = () => {
  //   if (selectedIds.length === users.length) {
  //     setSelectedIds([]);
  //   } else {
  //     setSelectedIds(users.map((u) => u.id));
  //   }
  // };

  // const toggleUser = (id: number) => {
  //   setSelectedIds((prev) =>
  //     prev.includes(id)
  //       ? prev.filter((x) => x !== id)
  //       : [...prev, id]
  //   );
  // };

  // const isAllSelected =
  //   users.length > 0 &&
  //   selectedIds.length === users.length;
  // if (users.length === 0) {
  //   return <h1>{t("common.noPermission")}</h1>
  // }
  return (
    <div className={styles.userContent}>
      <header className={styles.userHeader}>
        <div>
          <h1>{t("users.title")}</h1>

          <p className={styles.userDescription}>
            {t("users.description")}
          </p>
        </div>

        <button
          className={styles.addUserBtn}
          onClick={openCreateDialog}
        >
          {t("users.addUser")}
        </button>
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
            {users.map((user) => (
              <tr
                key={user.id}
                className={
                  selectedIds.includes(user.id)
                    ? `${styles.userRow} ${styles.selectedRow}`
                    : styles.userRow
                }
              >
                {/* Thêm class responsive riêng cho ô checkbox */}
                <td data-label="ID">
                  {user.id}
                </td>

                {/* Thêm data-label tương ứng với thẻ dịch t() */}
                <td data-label={t("users.fullName")}>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {user.fullname
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span>{user.fullname}</span>
                  </div>
                </td>

                <td data-label={t("users.email")}>{user.email}</td>

                <td data-label={t("users.groups")}>
                  <div className={styles.groupList}>
                    {user.groups.map((group) => (
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
                    <button
                      className={styles.actionBtn}
                      onClick={() => openEditDialog(user)}
                    >
                      <SettingsIcon />
                    </button>

                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => openDeleteDialog(user)}
                    >
                      <TrashIcon />
                    </button>
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
                  groups: editingUser.groups.map((g) => g.id),
                }
              : undefined
          }
          onClose={closeDialog}
          onSubmit={handleFormSubmit}
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
    </div>
  );
};

export default UserPage;