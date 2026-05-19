import { useState } from "react";
import styles from "../styles/user.module.css";
import UserFormDialog from "../component/UserFormDialog";
import { getAllGroups } from "../api/groupApi";
import { register } from "../api/authApi";
import type { User } from "../loader/userLoader";
import { useLoaderData } from "react-router";
import type { Group } from "../loader/groupLoader";
import { updateUser } from "../api/userApi";

const UserPage = () => {
  const usersLoaded = useLoaderData() as User[];
  const [users, setUsers] = useState(usersLoaded);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  const handleFormSubmit = async (data: {
    email: string;
    fullname: string;
    userRole: string;
    groups: number[];
  }) => {
    if (dialogMode === "create") {
      try {
        const response = await register(data);

        alert(
          "Created user, password is sent to this link: " +
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
        console.log(updateUser);
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

  return (
    <div className={styles.userContent}>
      <header className={styles.userHeader}>
        <div>
          <h1>User Management</h1>

          <p className={styles.userDescription}>
            Manage users, permissions and collaborative groups
            across Agent Hub.
          </p>
        </div>

        <button
          className={styles.addUserBtn}
          onClick={openCreateDialog}
        >
          Add User
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

              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Groups</th>
              <th className={styles.actionsCol}>Actions</th>
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
                  <span className={styles.roleBadge}>
                    {user.userRole}
                  </span>
                </td>

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
                      Edit
                    </button>

                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    >
                      Delete
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
                  groups: [],
                  userRole: editingUser.userRole,
                }
              : undefined
          }
          onClose={closeDialog}
          onSubmit={handleFormSubmit}
          groups={groups}
        />
      )}
    </div>
  );
};

export default UserPage;