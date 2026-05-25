// pages/InitResetPassword.tsx
import { useState } from "react";
import styles from "../styles/initResetPassword.module.css";
import { changePassword } from "../api/authApi";
import { useAuth } from "../hooks/authHook";

const InitResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { user, setUser } = useAuth();

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      await changePassword({ newPassword: password });
      setUser({...user, active: true})
      alert("Password reset successful");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.resetPage}>
      <div className={styles.backgroundGlow} />

      <div className={styles.resetCard}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h1>Reset Password</h1>

          <p>
            Create a new secure password for your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <div className={styles.formGroup}>
            <label>New Password</label>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className={
                errors.password ? styles.inputError : ""
              }
            />

            {errors.password && (
              <span className={styles.errorText}>
                {errors.password}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className={
                errors.confirmPassword
                  ? styles.inputError
                  : ""
              }
            />

            {errors.confirmPassword && (
              <span className={styles.errorText}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? "Updating Password..."
              : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitResetPassword;