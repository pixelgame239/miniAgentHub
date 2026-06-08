import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/groupdialog.module.css";
import { useTranslation } from "react-i18next";
import { findUsers, getUsers } from "../api/userApi";
import { useAuth } from "../hooks/authHook";

/* ─── Types ─────────────────────────────────── */
export type DialogMode = "create" | "update";

interface Permission {
  action: string;
  description: string;
  granted: boolean;
  value: string;
}

export interface Member {
  id: number;
  fullname: string;
  email: string;
}

export interface GroupDialogProps {
  mode: DialogMode;
  /** Pre-filled data when mode === "update" */
  initialData?: {
    groupName?: string;
    entityType?: "Users" | "Groups";
    permissions?: string[];
    members?: Member[];
  };
  onClose: () => void;
  onSubmit: (data: {
    groupName: string;
    permissions: Permission[];
    members: Member[];
  }) => void;
}

const USER_PERMISSIONS: Permission[] = [
  { action: "Create", description: "Create New Users", granted: false, value: "USER_C" },
  { action: "Read",   description: "View User Data",  granted: false, value:"USER_R" },
  { action: "Update", description: "Edit User Info",   granted: false, value: "USER_U" },
  { action: "Delete", description: "Remove Users",  granted: false, value: "USER_D" },
];

const GROUP_PERMISSIONS: Permission[] = [
  { action: "Create", description: "Create New Groups", granted: false, value:"GROUP_C" },
  { action: "Read",   description: "View Group Data",  granted: false, value:"GROUP_R"},
  { action: "Update", description: "Edit Group Settings",   granted: false, value:"GROUP_U" },
  { action: "Delete", description: "Remove Groups",  granted: false, value:"GROUP_D" },
  { action: "Add user to group", description: "Add user to group", granted: false, value:"GROUP_ADD_USER"},
  { action: "Remove user from group", description: "Remove user from group", granted: false, value: "GROUP_DELETE_USER"}
];

const getDefaultPermissions = (entityType: string): Permission[] => {
  switch (entityType) {
    case "Groups":
      return GROUP_PERMISSIONS;
    case "Users":
    default:
      return USER_PERMISSIONS;
  }
};

/* ─── Component ──────────────────────────────── */
const GroupDialog: React.FC<GroupDialogProps> = ({
  mode,
  initialData,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [availableUsers, setAvailableUsers] = useState<Member[]>([]);

  /* state */
  const [groupName, setGroupName] = useState(initialData?.groupName ?? "");
  
  // FIX 1: Chuẩn hóa thực thể ban đầu, đảm bảo viết hoa chữ cái đầu đồng bộ với cấu trúc dữ liệu hệ thống
  const [entityType, setEntityType] = useState<string>(() => {
    if (!initialData?.entityType) return "Users";
    // Tránh trường hợp BE hoặc dữ liệu cũ trả về "users"/"groups" hoặc "USERS"/"GROUPS"
    const formatted = initialData.entityType.trim().toLowerCase();
    return formatted === "groups" ? "Groups" : "Users";
  });
  
  // Track permissions separately for each entity type
  const [permissionsByType, setPermissionsByType] = useState<Record<string, Permission[]>>(() => {
    const initial: Record<string, Permission[]> = {
      Users: USER_PERMISSIONS.map((p) => ({ ...p })),
      Groups: GROUP_PERMISSIONS.map((p) => ({ ...p })),
    };

    if (initialData?.permissions) {
      initial.Users = initial.Users.map((p) => ({
        ...p,
        granted: initialData.permissions!.includes(p.value),
      }));

      initial.Groups = initial.Groups.map((p) => ({
        ...p,
        granted: initialData.permissions!.includes(p.value),
      }));
    }

    return initial;
  });
  
  // Get current permissions for active entity type
  const permissions = permissionsByType[entityType] || getDefaultPermissions(entityType);
  const [members, setMembers] = useState<Member[]>(initialData?.members ?? []);
  const [memberSearch, setMemberSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const fetchUsersByQuery = async () => {
      const response = await findUsers(memberSearch);
      if (response.data) {
        setAvailableUsers(response.data);
      }
    };
    fetchUsersByQuery();
  }, [memberSearch]);

  /* close on backdrop click */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // FIX 2: Đồng bộ hóa mảng các Tab dựa trên Key chuẩn ("Users", "Groups") đại diện cho State nội bộ
  const entityTabs = ["Users", "Groups"];

  /* toggle permission */
  const togglePermission = (index: number) => {
    setPermissionsByType((prev) => ({
      ...prev,
      [entityType]: prev[entityType].map((p, i) =>
        i === index ? { ...p, granted: !p.granted } : p
      ),
    }));
  };

  /* members */
  const addMember = (member: Member) => {
    setMembers((prev) => [...prev, member]);
    setMemberSearch("");
    setShowSuggestions(false);
  };

  const removeMember = (id: number) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  /* submit */
  const handleSubmit = () => {
    const allPermissions = [
      ...permissionsByType.Users,
      ...permissionsByType.Groups
    ];
    onSubmit({ groupName, permissions: allPermissions, members });
    onClose();
  };

  const isCreate = mode === "create";
  const title = isCreate ? t("groupDialog.createTitle") : t("groupDialog.editTitle");
  const subtitle = isCreate
    ? t("groupDialog.createDescription")
    : t("groupDialog.editDescription");
  const submitLabel = isCreate ? t("groupDialog.initializeGroup") : t("groupDialog.updateGroup");

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true">
        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* IDENTITY */}
          <section className={styles.section}>
            <span className={styles.sectionLabel}>{t("groupDialog.identity")}</span>

            <div className={styles.identityGrid}>
              {/* Group Name */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{t("groups.groupName")}</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Quantum Research Team"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              {/* Entity Type */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{t("groupDialog.entityType")}</label>
                <div className={styles.tabGroup}>
                  {entityTabs.map((tab) => (
                    <button
                      key={tab}
                      className={`${styles.tab} ${entityType === tab ? styles.tabActive : ""}`}
                      onClick={() => setEntityType(tab)}
                    >
                      {/* Giữ nguyên logic Translate text hiển thị ra UI, không làm ảnh hưởng data gốc */}
                      {tab === "Users" ? t("groupDialog.usersTab", "USERS") : t("groupDialog.groupsTab", "GROUPS")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* RBAC PERMISSIONS */}
          <section className={styles.section}>
            <div className={styles.rbacHeader}>
              <span className={styles.sectionLabelAccent}>{t("groupDialog.rbacPermissions")}</span>
              <span className={styles.rbacTag}>{t("groupDialog.rbacTag")}</span>
            </div>

            <div className={styles.permissionsTable}>
              <div className={styles.permHead}>
                <span>{t("groupDialog.action")}</span>
                <span>{isCreate ? t("groupDialog.description") : t("groupDialog.scope")}</span>
                <span className={styles.grantCol}>{t("groupDialog.grant")}</span>
              </div>
              {permissions.map((perm, i) => (
                <div
                  key={perm.action}
                  className={`${styles.permRow} ${perm.granted ? styles.permRowGranted : ""}`}
                >
                  <span className={styles.permAction}>{perm.action}</span>
                  <span className={styles.permDesc}>{perm.description}</span>
                  <div className={styles.grantCol}>
                    <button
                      className={`${styles.checkbox} ${perm.granted ? styles.checkboxChecked : ""}`}
                      onClick={() => togglePermission(i)}
                      aria-checked={perm.granted}
                      role="checkbox"
                    >
                      {perm.granted && <CheckIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* INITIAL MEMBERS */}
          <section className={styles.section}>
            <span className={styles.sectionLabelAccent}>{isCreate ? t("groupDialog.initialMembers") : t("groupDialog.currentMembers")}</span>

            <div className={styles.memberSearchWrapper}>
              <span className={styles.memberSearchIcon}><AddUserIcon /></span>
              <input
                className={styles.memberInput}
                type="text"
                placeholder={t("groupDialog.searchMembers")}
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && availableUsers.length > 0 && (
                <div className={styles.suggestions}>
                  {availableUsers.filter((s) => members.every((m) => m.id !== s.id)).map((s) => (
                    <button
                      key={s.id}
                      className={styles.suggestionItem}
                      onMouseDown={() => addMember(s)}
                    >
                      <span className={styles.suggestionAvatar}>
                        {s.fullname.charAt(0)}
                      </span>
                      {s.fullname} - {s.email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {members.length > 0 && (
              <div className={styles.memberTags}>
                {members.map((m) => (
                  <span key={m.id} className={styles.memberTag}>
                    <span className={styles.memberTagAvatar}>{m.fullname.charAt(0)}</span>
                    {m.fullname}
                    <button
                      className={styles.memberTagRemove}
                      onClick={() => removeMember(m.id)}
                      aria-label={`Remove ${m.fullname}`}
                    >
                      <XSmallIcon />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Icons ──────────────────────────────────── */
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function XSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function AddUserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export default GroupDialog;