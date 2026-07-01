import { useState, useEffect, type SubmitEvent } from "react";
import styles from "../styles/dialog.module.css"; 
import type { Group } from "../loader/groupLoader";
import { useTranslation } from "react-i18next";

interface UserFormData {
  email: string;
  fullname: string;
  groups: number[]; 
}

interface UserFormDialogProps {
  mode: "create" | "edit";
  initialData?: UserFormData; 
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  submitting: boolean;
  groups: Group[];
}

const UserFormDialog = ({
  mode,
  initialData,
  onClose,
  onSubmit,
  submitting,
  groups,
}: UserFormDialogProps) => {
  const { t } = useTranslation();

  // Form states
  const [form, setForm] = useState<UserFormData>({
    fullname: "",
    email: "",
    groups: [],
  });
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  // States quản lý lỗi tại dòng input
  const [errors, setErrors] = useState<{
    fullname?: string;
    email?: string;
    groups?: string;
  }>({});

  // States đánh dấu xem người dùng đã chạm/gõ vào ô đó chưa
  const [touched, setTouched] = useState<{
    fullname?: boolean;
    email?: boolean;
  }>({});

  // Màu sắc Warning thay cho màu đỏ nguy hiểm (Tone màu Amber/Orange sang trọng)
  const warningColor = "#ff0000"; 

  const validateEmailFormat = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  // Khởi tạo dữ liệu form ban đầu
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm(initialData);
      setSelectedGroupIds(initialData.groups || []);
    } else {
      // Tìm nhóm USER mặc định, nếu không có thì lấy phần tử đầu tiên trong mảng groups
      const defaultGroup = groups.find((g) => g.groupName === "USER")?.id || groups[0]?.id;
      if (defaultGroup) {
        setForm({ fullname: "", email: "", groups: [defaultGroup] });
        setSelectedGroupIds([defaultGroup]);
      }
    }
    setErrors({});
    setTouched({});
  }, [mode, initialData, groups]);

  // REAL-TIME VALIDATION
  useEffect(() => {
    const newErrors: typeof errors = {};

    // Validate Full Name
    if (touched.fullname && !form.fullname.trim()) {
      newErrors.fullname = t("users.fullNameRequired") || "Họ và tên không được để trống";
    }

    // Validate Email
    if (mode === "create" && touched.email) {
      if (!form.email.trim()) {
        newErrors.email = t("users.emailRequired") || "Email không được để trống";
      } else if (!validateEmailFormat(form.email)) {
        newErrors.email = t("login.invalidEmail") || "Email không đúng định dạng";
      }
    }

    // Validate Nhóm quyền
    const currentGroups = mode === "create" ? form.groups : selectedGroupIds;
    if (currentGroups.length === 0) {
      newErrors.groups = t("users.groupRequired") || "Vui lòng chọn ít nhất một nhóm";
    }

    setErrors(newErrors);
  }, [form.fullname, form.email, form.groups, selectedGroupIds, touched, mode, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleGroupSelect = (groupId: number) => {
    if (mode === "create") {
      setForm((prev) => ({ ...prev, groups: [groupId] }));
    } else {
      setSelectedGroupIds((prev) =>
        prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      );
    }
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    setTouched({ fullname: true, email: true });

    const currentGroups = mode === "create" ? form.groups : selectedGroupIds;
    const hasError = 
      !form.fullname.trim() || 
      (mode === "create" && (!form.email.trim() || !validateEmailFormat(form.email))) ||
      currentGroups.length === 0;

    if (hasError) return;

    const dataToSubmit = { ...form };
    if (mode === "edit") {
      dataToSubmit.groups = selectedGroupIds;
    }
    onSubmit(dataToSubmit);
  };

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
          
          {/* TRƯỜNG FULL NAME */}
          <div className={styles["form-field"]}>
            <label htmlFor="fullname">
              {t("users.fullName")} <span style={{ color: warningColor }}>*</span>
            </label>
            <input
              id="fullname"
              name="fullname"
              type="text"
              placeholder={t("users.fullName")}
              value={form.fullname}
              onChange={handleChange}
              style={errors.fullname ? { borderColor: warningColor } : {}}
              className={errors.fullname ? styles["input-error"] : ""}
            />
            {errors.fullname && (
              <span style={{ color: warningColor }} className={styles["error-message"]}>
                {errors.fullname}
              </span>
            )}
          </div>

          {/* TRƯỜNG EMAIL */}
          <div className={styles["form-field"]}>
            <label htmlFor="email">
              {t("users.email")} {mode === "create" && <span style={{ color: warningColor }}>*</span>}
            </label>
            <input
              id="email"
              name="email"
              type="text" 
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              disabled={mode === "edit"}
              style={errors.email ? { borderColor: warningColor } : {}}
              className={errors.email ? styles["input-error"] : ""}
            />
            {errors.email && (
              <span style={{ color: warningColor }} className={styles["error-message"]}>
                {errors.email}
              </span>
            )}
          </div>

          {/* TRƯỜNG GROUP */}
          <div className={styles["form-field"]}>
            <label>
              {t("users.groups")} <span style={{ color: warningColor }}>*</span>
            </label>
            {mode === "create" ? (
              <select
                value={form.groups[0] || ""}
                onChange={(e) => handleGroupSelect(Number(e.target.value))}
                style={errors.groups ? { borderColor: warningColor } : {}}
                className={`${styles["group-select"]} ${errors.groups ? styles["input-error"] : ""}`}
              >
                {/* ĐÃ BỎ LỰA CHỌN "..." TRỐNG */}
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            ) : (
              <div 
                style={errors.groups ? { borderColor: warningColor } : {}}
                className={`${styles["multi-select"]} ${errors.groups ? styles["input-error"] : ""}`}
              >
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
            {errors.groups && (
              <span style={{ color: warningColor }} className={styles["error-message"]}>
                {errors.groups}
              </span>
            )}
          </div>

          {/* HÀNH ĐỘNG BUTTONS */}
          <div className={styles["dialog-actions"]}>
            <button
              type="button"
              className={styles["cancel-btn"]}
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button 
              type="submit" 
              className={styles["submit-btn"]} 
              disabled={submitting || Object.keys(errors).length > 0}
            >
              {submitting ? t("common.loading") : mode === "create" ? t("users.createUser") : t("users.updateUser")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormDialog;