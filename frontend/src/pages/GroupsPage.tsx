import React from "react";
import styles from "../styles/groups.module.css";
import { useLoaderData } from "react-router";
import type { Group } from "../loader/groupLoader";
import { useTranslation } from "react-i18next";

const GroupsPage: React.FC = () => {
  const groups = useLoaderData() as Group[];
  const { t } = useTranslation();

  return (
    <div className={styles.groupsPage}>
      <div className={styles.heroSection}>
        <div>
          <h1 className={styles.pageTitle}>
            {t("groups.title")}
          </h1>

          <p className={styles.pageDescription}>
            {t("groups.description")}
          </p>
        </div>

        <button className={styles.createButton}>
          <UserPlusIcon />

          <span>{t("groups.createGroup")}</span>
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            {t("groups.activeGroups")}
          </h2>

          <div className={styles.totalBadge}>
            {groups.length} {t("groups.total")}
          </div>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHead}>
            <div>{t("groups.groupName")}</div>
            <div>{t("groups.members")}</div>
            <div className={styles.actionsColumn}>
              {t("groups.actions")}
            </div>
          </div>

          {groups.map((group) => (
            <div
              key={group.id}
              className={styles.tableRow}
            >
              <div className={styles.groupName}>
                {group.groupName}
              </div>

              <div className={styles.memberCount}>
                {group.totalUsers}
              </div>

              <div className={styles.actions}>
                <button className={styles.iconButton}>
                  <InfoIcon />
                </button>

                <button className={styles.iconButton}>
                  <UsersIcon />
                </button>

                <button className={styles.iconButton}>
                  <SettingsIcon />
                </button>

                <button
                  className={`${styles.iconButton} ${styles.deleteButton}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function UserPlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82" />
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

export default GroupsPage;