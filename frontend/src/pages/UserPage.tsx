import { useState } from "react";
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
  const nav = useNavigate();
  if(!user?.userAccess){
    nav("/chat");
  }

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
  const handleFormSubmit = async (data: {
    email: string;
    fullname: string;
    groups: number[];
  }) => {
    if (dialogMode === "create") {
      try {
        const response = await register(data);
        if(response.data) setUsers([...users,response.data.userData]);
        alert(
          t("users.sendEmail") +
            response.data?.emailLink
        );
      } catch (err) {
        console.error(err);
      }
    } else{
      try{
        const response = await updateUser(data, editingUser?.id);
        const updatedUser = response.data;
        if (!updatedUser) {
          console.error("Dữ liệu cập nhật không hợp lệ");
          return;
        }
        setUsers(prevUsers => 
            prevUsers.map(user => 
                user.id === editingUser?.id ? updatedUser : user
            )
        );
      }catch(error){
        console.error(error);
      }
    }

    closeDialog();
  };
  const handledeletedUser = async () => {
    if (!deletedUser) return;

    try {
      await deleteUser(deletedUser.id);

      setUsers((prev) =>
        prev.filter((user) => user.id !== deletedUser.id)
      );
      closeDeleteDialog();
    } catch (error) {
      console.error(error);
    }
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleUser = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const isAllSelected =
    users.length > 0 &&
    selectedIds.length === users.length;
  if (users.length === 0) {
    return <h1>You don't have permission to view Users</h1>
  }
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
              <th className={styles.checkboxCol}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
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
                    ? styles.selectedRow
                    : ""
                }
              >
                <td className={styles.checkboxCol}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                  />
                </td>

                <td>
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

                <td>{user.email}</td>

                <td>
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

                <td className={styles.actionsCol}>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => openEditDialog(user)}
                    >
                      {t("users.edit")}
                    </button>

                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => openDeleteDialog(user)}
                    >
                      {t("users.delete")}
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
              <h2>{t("users.deletedUser")}</h2>

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