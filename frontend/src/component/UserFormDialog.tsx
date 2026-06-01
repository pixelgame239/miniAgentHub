import { useState, useEffect, type SubmitEvent } from "react";
import styles from "../styles/dialog.module.css"; // Changed to CSS Module
import type { Group } from "../loader/groupLoader";
import { useTranslation } from "react-i18next";


interface UserFormData {
  email: string;
  fullname: string;
  groups: number[]; // array of group IDs
}

interface UserFormDialogProps {
  mode: "create" | "edit";
  initialData?: UserFormData; // passed when editing
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  groups: Group[];
}

const UserFormDialog = ({
  mode,
  initialData,
  onClose,
  onSubmit,
  groups,
}: UserFormDialogProps) => {
  const [form, setForm] = useState<UserFormData>({
    fullname: "",
    email: "",
    groups: [],
  });

  // For edit mode: store selected group IDs (as numbers)
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm(initialData);
      setSelectedGroupIds(initialData.groups || []);
    } else {
      setForm({ fullname: "", email: "", groups: []});
      setSelectedGroupIds([]);
    }
  }, [mode, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // For add mode: single group selected
  const handleGroupSelect = (groupId: number) => {
    if (mode === "create") {
      setForm((prev) => ({ ...prev, groups: [groupId] }));
    } else {
      // Multi-select for edit: toggle group ID
      setSelectedGroupIds((prev) =>
        prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      );
    }
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const dataToSubmit = { ...form };
    if (mode === "edit") {
      // Use the selected group IDs
      dataToSubmit.groups = selectedGroupIds;
    }
    onSubmit(dataToSubmit);
  };

  // Helper to get group name by ID
  const getGroupName = (groupId: number) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.groupName : "";
  };

  return (
    <div className={styles["dialog-overlay"]} onClick={onClose}>
      <div className={styles["dialog-card"]} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles["dialog-title"]}>
          {mode === "create" ? t("users.createUser") : t("users.updateUser")}
        </h2>
        <form onSubmit={handleSubmit} className={styles["dialog-form"]}>
          {/* Full Name */}
          <div className={styles["form-field"]}>
            <label htmlFor="fullname">{t("users.fullName")}</label>
            <input
              id="fullname"
              name="fullname"
              type="text"
              placeholder={t("users.fullName")}
              value={form.fullname}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className={styles["form-field"]}>
            <label htmlFor="email">{t("users.email")}</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              required
              disabled={mode === "edit"}
            />
          </div>

          {/* Group(s) – differs by mode */}
          <div className={styles["form-field"]}>
            <label>
              {t("users.groups")}
            </label>
            {mode === "create" ? (
              <select
                value={form.groups[0] || ""}
                onChange={(e) => handleGroupSelect(Number(e.target.value))}
                className={styles["group-select"]}
              >
                <option value="">...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            ) : (
              <div className={styles["multi-select"]}>
                <div className={styles["selected-tags"]}>
                  {selectedGroupIds.map((groupId) => (
                    <span key={groupId} className={styles["tag"]}>
                      {getGroupName(groupId)}
                      <button
                        type="button"
                        className={styles["tag-remove"]}
                        onClick={() => handleGroupSelect(groupId)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className={styles["add-group-row"]}>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleGroupSelect(Number(e.target.value));
                      e.target.value = "";
                    }}
                    className={styles["group-select"]}
                  >
                    <option value="">Add group...</option>
                    {groups
                      .filter((g) => !selectedGroupIds.includes(g.id))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.groupName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className={styles["dialog-actions"]}>
            <button
              type="button"
              className={styles["cancel-btn"]}
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button type="submit" className={styles["submit-btn"]}>
              {mode === "create" ? t("users.createUser") : t("users.updateUser")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormDialog;