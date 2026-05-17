import GavelIcon from "@mui/icons-material/Gavel";
import styles from "./Admin_panel.module.css";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import Search from "../search/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { authEmitter } from "../services/authEmitter";
import type { UserRole } from "../post_area/PostArea";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface Report {
  id: string;
  reporter: string;
  postTitle: string;
  rule: string;
  reported_user_id: string;
  post_id: string;
}

interface ModeratorPanelProps {
  role?: UserRole | null;
}

export default function Moderator_panel({ role }: ModeratorPanelProps) {
  const { communityId } = useParams();
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const [modModal, setModModal] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({ isOpen: false, userId: null });
  const [tempPerms, setTempPerms] = useState({
    can_delete_posts: false,
    can_ban_users: false,
    can_manage_mods: false,
  });

  const fetchMembers = async () => {
    const token = localStorage.getItem("token");
    if (!communityId) return;
    try {
      const memRes = await fetch(
        `http://localhost:5000/api/communities-by-id/${communityId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!memRes.ok) throw new Error("Błąd pobierania członków");
      const membersData = await memRes.json();

      setUsers(
        membersData.map((u: any) => ({
          id: u.id,
          name: u.username,
          username: u.username,
          avatarPath: u.avatar_url || "/img/pepe_placeholder.png",
          role: u.role,
          isMod: u.role === "moderator",
          isOwner: u.role === "owner",
          isBanned: u.is_banned,
          permissions: {
            can_delete_posts: u.can_delete_posts,
            can_ban_users: u.can_ban_users,
            can_manage_mods: u.can_manage_mods,
          },
        })),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    if (!communityId) return;
    try {
      const repRes = await fetch(
        `http://localhost:5000/api/communities-by-id/${communityId}/reports`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (repRes.ok) {
        const reportsData = await repRes.json();
        if (Array.isArray(reportsData)) {
          setReports(reportsData);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (communityId) {
      fetchMembers();
      fetchReports();
    }
  }, [communityId]);

  const handleDeleteReport = async (reportId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5000/api/communities-by-id/${communityId}/reports/${reportId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        authEmitter.emit("reportsChanged");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten post?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.post_id !== postId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBan = async (
    targetUserId: string,
    isCurrentlyBanned: boolean,
  ) => {
    const action = isCurrentlyBanned ? "unban" : "ban";
    if (!window.confirm("Potwierdź zmianę statusu blokady użytkownika."))
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/communities/${communityId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: targetUserId }),
        },
      );
      if (res.ok) fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const saveModPermissions = async () => {
    const token = localStorage.getItem("token");
    if (!modModal.userId) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/communities-by-id/${communityId}/members/${modModal.userId}/permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            can_delete_posts: tempPerms.can_delete_posts,
            can_ban_users: tempPerms.can_ban_users,
            can_manage_mods: tempPerms.can_manage_mods,
          }),
        },
      );

      if (res.ok) {
        alert("Uprawnienia zostały zapisane!");
        setModModal({ isOpen: false, userId: null });

        setUsers((prev) =>
          prev.map((u) =>
            u.id === modModal.userId
              ? {
                  ...u,
                  role: "moderator",
                  can_delete_posts: tempPerms.can_delete_posts,
                  can_ban_users: tempPerms.can_ban_users,
                  can_manage_mods: tempPerms.can_manage_mods,
                }
              : u,
          ),
        );
      } else {
        const data = await res.json();
        alert(data.error || "Błąd podczas zapisywania uprawnień");
      }
    } catch (err) {
      console.error("Błąd sieci:", err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()),
  );

  if (
    !role ||
    (!role.can_delete_posts && !role.can_ban_users && !role.can_manage_mods)
  ) {
    return (
      <main className={styles.container}>
        <div>
          <h2>Brak dostępu</h2>
          <p>Nie masz uprawnień do przeglądania tego panelu.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div>
        <div className={styles.banContainer}>
          <Search
            value={userSearch}
            onChange={(e: any) => setUserSearch(e.target.value)}
          />
          <form id="my-admin-form" onSubmit={(e) => e.preventDefault()}>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {filteredUsers.map((user) => (
                <li key={user.id} className={styles.userRow}>
                  <img
                    className={styles.avatar}
                    src={user.avatar_url || "/img/pepe_placeholder.png"}
                    alt="img"
                  />
                  <span className={styles.text}>{user.username}</span>

                  <div style={{ display: "flex", gap: "5px" }}>
                    {role?.can_ban_users &&
                      user.role !== "owner" &&
                      user.id !== authEmitter.getUser() && (
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleBan(user.id, user.isBanned)
                          }
                          className={styles.btnUnunban}
                        >
                          {user.isBanned ? "ODBANUJ" : "BAN"}{" "}
                          <GavelIcon className={styles.icon} />
                        </button>
                      )}
                    {user.role === "owner" ? (
                      <span className={styles.ownerBadge}>Właściciel</span>
                    ) : (
                      <button
                        className={
                          user.role === "moderator"
                            ? styles.isMod
                            : styles.notMod
                        }
                        onClick={async () => {
                          if (user.role === "moderator") {
                            const konfirm = confirm(
                              "Czy na pewno chcesz odebrać uprawnienia moderatora?",
                            );
                            if (!konfirm) return;

                            const token = localStorage.getItem("token");
                            try {
                              const res = await fetch(
                                `http://localhost:5000/api/communities-by-id/${communityId}/members/${user.id}/permissions`,
                                {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` },
                                },
                              );
                              if (res.ok) {
                                setUsers((prev) =>
                                  prev.map((u) =>
                                    u.id === user.id
                                      ? {
                                          ...u,
                                          role: "member",
                                          can_delete_posts: false,
                                          can_ban_users: false,
                                          can_manage_mods: false,
                                        }
                                      : u,
                                  ),
                                );
                              } else {
                                const data = await res.json();
                                alert(
                                  data.error ||
                                    "Błąd podczas odbierania uprawnień",
                                );
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          } else {
                            setModModal({ isOpen: true, userId: user.id });
                            setTempPerms({
                              can_delete_posts: user.can_delete_posts || false,
                              can_ban_users: user.can_ban_users || false,
                              can_manage_mods: user.can_manage_mods || false,
                            });
                          }
                        }}
                      >
                        {user.role === "moderator" ? "MODERATOR" : "DAJ MODA"}
                        {user.role === "moderator" ? (
                          <RemoveCircleIcon className={styles.icon} />
                        ) : (
                          <PersonAddIcon className={styles.icon} />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </form>
        </div>
      </div>

      <div>
        <div className={styles.reportedPosts}>
          <div className={styles.tableContainer}>
            <div className={styles.tableHeaderTitle}>ZGŁOSZONE POSTY</div>
            <form id="reports-form" onSubmit={(e) => e.preventDefault()}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <td>NAZWA ZGŁASZAJĄCEGO</td>
                    <td>TYTUŁ ZGŁOSZONEGO POSTA</td>
                    <td>ZŁAMANA ZASADA</td>
                    <td className={styles.action}>AKCJE</td>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.reporter}</td>
                      <td>{report.postTitle}</td>
                      <td>{report.rule}</td>
                      <td>
                        <div className={styles.actionsCell}>
                          {role?.can_delete_posts ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(report.post_id)}
                                className={styles.btnActionDelete}
                              >
                                USUŃ <DeleteIcon className={styles.icon} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(report.id)}
                                className={styles.btnActionIgnore}
                              >
                                IGNORUJ <CheckIcon className={styles.icon} />
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: "12px", color: "gray" }}>
                              Brak uprawnień
                            </span>
                          )}

                          {role?.can_ban_users && report.reported_user_id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleBan(report.reported_user_id, false)
                              }
                              className={styles.btnActionDelete}
                              style={{ backgroundColor: "#ff4444" }}
                            >
                              BAN <GavelIcon className={styles.icon} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </form>
          </div>
        </div>
      </div>

      {modModal.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModModal({ isOpen: false, userId: null })}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalHeader}>
              USTAW ROLĘ I UPRAWNIENIA MODERATORA
            </h3>
            <label className={styles.customCheckContainer}>
              <span>USUWANIE POSTÓW</span>
              <input
                type="checkbox"
                checked={tempPerms.can_delete_posts}
                onChange={(e) =>
                  setTempPerms({
                    ...tempPerms,
                    can_delete_posts: e.target.checked,
                  })
                }
              />
            </label>
            <label className={styles.customCheckContainer}>
              <span>BANOWANIE UŻYTKOWNIKÓW</span>
              <input
                type="checkbox"
                checked={tempPerms.can_ban_users}
                onChange={(e) =>
                  setTempPerms({
                    ...tempPerms,
                    can_ban_users: e.target.checked,
                  })
                }
              />
            </label>
            <label className={styles.customCheckContainer}>
              <span>ZARZĄDZANIE MODERATORAMI</span>
              <input
                type="checkbox"
                checked={tempPerms.can_manage_mods}
                onChange={(e) =>
                  setTempPerms({
                    ...tempPerms,
                    can_manage_mods: e.target.checked,
                  })
                }
              />
            </label>
            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={saveModPermissions}
              >
                ZAPISZ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
