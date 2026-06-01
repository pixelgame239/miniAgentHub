import React, { useState, useEffect } from "react";
import styles from "../styles/groupMembers.module.css";
import { useTranslation } from "react-i18next";
import type { Group } from "../loader/groupLoader";
import type { User } from "../loader/userLoader";
import { getGroupUsers, getUsers } from "../api/userApi";
import { removeUser, addUser } from "../api/groupApi";

interface GroupMembersModalProps {
  open: boolean;
  group: Group;
  onClose: () => void;
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  open,
  group,
  onClose,
}) => {
  const { t } = useTranslation();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, group]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await getGroupUsers(group.id);
      if (response.data) {
        console.log(response.data);
        setMembers(response.data);
      }
    } catch (err) {
      console.error("Error loading members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    try {
      await removeUser(group.id, userId);
      setMembers(members.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Error removing user:", err);
    }
  };

  const handleAddUsers = async () => {
    if (selectedUsersToAdd.length === 0) return;
    try {
      await addUser(group.id, selectedUsersToAdd);
      // Reload members
      await loadMembers();
      setSelectedUsersToAdd([]);
      setShowAddDialog(false);
    } catch (err) {
      console.error("Error adding users:", err);
    }
  };

  if (!open) return null;

  const availableUsers = allUsers.filter(
    (user) => !members.some((m) => m.id === user.id)
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{group.groupName}</h2>
            <p className={styles.modalDescription}>
              Manage group members and their permissions
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Members</h3>
              <div className={styles.tableHeaderActions}>
                <div className={styles.totalBadge}>
                  {members.length} {members.length === 1 ? "member" : "members"}
                </div>
                <button
                  className={styles.addUserBtn}
                  onClick={() => setShowAddDialog(true)}
                >
                  <PlusIcon />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className={styles.loadingState}>Loading members...</div>
            ) : members.length === 0 ? (
              <div className={styles.emptyState}>
                No members in this group yet
              </div>
            ) : (
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <div className={styles.nameCol}>Full Name</div>
                  <div className={styles.emailCol}>Email</div>
                  <div className={styles.groupsCol}>Groups</div>
                  <div className={styles.actionsCol}>Actions</div>
                </div>

                {members.map((user) => (
                  <div key={user.id} className={styles.tableRow}>
                    <div className={styles.nameCol}>
                      <span className={styles.userName}>{user.fullname}</span>
                    </div>
                    <div className={styles.emailCol}>{user.email}</div>
                    <div className={styles.groupsCol}>
                      {user.groups?.length || 0} group(s)
                    </div>
                    <div className={styles.actionsCol}>
                      <button
                        className={`${styles.iconButton} ${styles.deleteBtn}`}
                        onClick={() => handleRemoveUser(user.id)}
                        aria-label={`Remove ${user.fullname}`}
                        title="Remove from group"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Users Dialog */}
      {showAddDialog && (
        <div
          className={styles.nestedModalOverlay}
          onClick={() => setShowAddDialog(false)}
        >
          <div
            className={styles.nestedModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.nestedModalHeader}>
              <h3>Add Users to Group</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowAddDialog(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.nestedModalContent}>
              {availableUsers.length === 0 ? (
                <p>All users are already in this group</p>
              ) : (
                <div className={styles.userList}>
                  {availableUsers.map((user) => (
                    <label key={user.id} className={styles.userCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedUsersToAdd.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsersToAdd([
                              ...selectedUsersToAdd,
                              user.id,
                            ]);
                          } else {
                            setSelectedUsersToAdd(
                              selectedUsersToAdd.filter((id) => id !== user.id)
                            );
                          }
                        }}
                      />
                      <span>
                        {user.fullname} ({user.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.nestedModalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleAddUsers}
                disabled={selectedUsersToAdd.length === 0}
              >
                Add Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Icons ──────────────────────────────────── */
function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default GroupMembersModal;
