import React, { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import styles from "./Admin_panel.module.css";
import Search from "../search/Search";
import GavelIcon from "@mui/icons-material/Gavel";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { authEmitter } from "../services/authEmitter";
import type { UserRole } from "../post_area/PostArea";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircle";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircle";
import BlockIcon from "@mui/icons-material/Block";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface Report {
  id: string;
  reporter: string;
  postTitle: string;
  rule: string;
  reported_user_id: string;
  post_id: string;
}

interface AdminPanelProps {
  role?: UserRole | null;
}

export default function Admin_panel({ role }: AdminPanelProps) {
  const { communityId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [communityName, setCommunityName] = useState("Ładowanie...");
  const [communityDesc, setCommunityDesc] = useState("Ładowanie opisu...");
  const [rules, setRules] = useState<
    { rule_title: string; description: string }[]
  >([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const [modModal, setModModal] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({
    isOpen: false,
    userId: null,
  });

  const [tempPermissions, setTempPermissions] = useState({
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

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!communityId) return;

      try {
        const tagsRes = await fetch("http://localhost:5000/api/tags");
        let allTags: any[] = [];
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          allTags = tagsData.map((t: any, index: number) => ({
            id: index,
            name: typeof t === "string" ? t : t.name,
            isSelected: false,
          }));
        }

        const detailsRes = await fetch(
          `http://localhost:5000/api/communities-by-id/${communityId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          setCommunityName(details.name);
          setCommunityDesc(details.desc || details.description || "");
          setRules(details.rules || []);

          const communityTags =
            details.community_tags?.map((ct: any) => ct.tags.name) || [];
          const syncedTags = allTags.map((tag) => ({
            ...tag,
            isSelected: communityTags.includes(tag.name),
          }));
          setTags(syncedTags);
        }

        await fetchMembers();

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

    fetchData();
  }, [communityId]);

  const toggleTag = (tagId: number) => {
    setTags((prev) => {
      const isSelected = prev.find((t) => t.id === tagId)?.isSelected;
      const currentSelectedCount = prev.filter((t) => t.isSelected).length;

      if (!isSelected && currentSelectedCount >= 3) {
        return prev;
      }

      return prev.map((tag) =>
        tag.id === tagId ? { ...tag, isSelected: !tag.isSelected } : tag,
      );
    });
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

  const openModModal = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setTempPermissions(
        user.permissions || {
          can_delete_posts: false,
          can_ban_users: false,
          can_manage_mods: false,
        },
      );
      setModModal({ isOpen: true, userId: id });
    }
  };

  const saveModPermissions = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5000/api/communities/${communityId}/members/${modModal.userId}/permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "moderator", ...tempPermissions }),
        },
      );
      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.id === modModal.userId
              ? { ...u, isMod: true, permissions: tempPermissions }
              : u,
          ),
        );
        setModModal({ isOpen: false, userId: null });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeMod = async (id: string) => {
    if (!window.confirm("Odebrać uprawnienia moda?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5000/api/communities/${communityId}/members/${id}/permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: "member",
            can_delete_posts: false,
            can_ban_users: false,
            can_manage_mods: false,
          }),
        },
      );
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isMod: false } : u)),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleSaveCommunity = async (e: FormEvent) => {
    e.preventDefault();
    const token = authEmitter.getToken();
    const selectedTagsStrings = tags
      .filter((t) => t.isSelected)
      .map((t) => t.name);

    const formData = new FormData();
    formData.append("name", communityName);
    formData.append("description", communityDesc);
    formData.append("tags", JSON.stringify(selectedTagsStrings));
    formData.append("rules", JSON.stringify(rules));
    if (fileInputRef.current?.files?.[0]) {
      formData.append("avatar", fileInputRef.current.files[0]);
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/communities-by-id/${communityId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      if (res.ok) alert("Zmiany zostały zapisane.");
    } catch (err) {
      console.error(err);
    }
  };

  const addRule = () =>
    setRules([...rules, { rule_title: "Nowa Zasada", description: "" }]);
  const removeRule = (index: number) =>
    setRules(rules.filter((_, i) => i !== index));
  const updateRule = (index: number, field: string, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  return (
    <main className={styles.containerAdmin}>
      {role?.role === "owner" && (
        <div className={styles.first}>
          <form onSubmit={handleSaveCommunity} className={styles.editForm}>
            <div className={styles.formThreeColumns}>
              <div className={styles.column}>
                <h4>INFORMACJE</h4>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    className={styles.topicInput}
                    maxLength={300}
                  />
                  <span className={styles.charCounter}>
                    {communityName.length}/300
                  </span>
                </div>
                <textarea
                  className={styles.textContent}
                  value={communityDesc}
                  onChange={(e) => setCommunityDesc(e.target.value)}
                />
                <div
                  className={styles.uploadBox}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                  />
                  <ArrowForwardIcon
                    className={styles.uploadIcon}
                    style={{ transform: "rotate(-45deg)" }}
                  />
                  <p>Zmień ikonę</p>
                </div>
              </div>

              <div className={styles.column}>
                <h4>ZASADY</h4>
                <div className={styles.rulesList}>
                  {rules.map((rule, index) => (
                    <div key={index} className={styles.ruleItem}>
                      <input
                        type="text"
                        placeholder="Tytuł"
                        value={rule.rule_title}
                        className={styles.ruleInput}
                        onChange={(e) =>
                          updateRule(index, "rule_title", e.target.value)
                        }
                      />
                      <textarea
                        placeholder="Opis"
                        value={rule.description}
                        className={styles.ruleTextarea}
                        onChange={(e) =>
                          updateRule(index, "description", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className={styles.btnRemoveRule}
                        onClick={() => removeRule(index)}
                      >
                        Usuń <RemoveCircleOutlineIcon fontSize="small" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRule}
                    className={styles.btnAddRule}
                  >
                    Dodaj zasadę <AddCircleOutlineIcon fontSize="small" />
                  </button>
                </div>
              </div>

              <div className={styles.column}>
                <div className={styles.tagsContainer}>
                  <div className={styles.tableHeaderTitle}>
                    TAGI ({tags.filter((t) => t.isSelected).length}/3)
                  </div>
                  <div className={styles.searchBar}>
                    <Search
                      value={userSearch}
                      onChange={(e: any) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className={styles.tagList}>
                    {tags
                      .filter((t) =>
                        t.name.toLowerCase().includes(userSearch.toLowerCase()),
                      )
                      .map((tag) => {
                        const canSelect =
                          tag.isSelected ||
                          tags.filter((t) => t.isSelected).length < 3;
                        return (
                          <div
                            key={tag.id}
                            className={`${styles.tagItem} ${!canSelect ? styles.disabled : ""}`}
                            onClick={() => toggleTag(tag.id)}
                          >
                            <span>{tag.name}</span>
                            <div
                              className={`${styles.checkCircle} ${tag.isSelected ? styles.active : ""}`}
                            >
                              <CheckIcon fontSize="small" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.actionButtons}>
              <button type="submit" className={styles.btnSubmit}>
                ZATWIERDŹ ZMIANY <CheckIcon fontSize="small" />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.banContainer}>
        <div className={styles.searchBar}>
          <Search
            value={userSearch}
            onChange={(e: any) => setUserSearch(e.target.value)}
          />
        </div>
        {users
          .filter((u) =>
            u.name.toLowerCase().includes(userSearch.toLowerCase()),
          )
          .map((user) => (
            <div key={user.id} className={styles.userRow}>
              <div className={styles.inputWrapper}>
                <img className={styles.avatar} src={user.avatarPath} alt="" />
                <span className={styles.name}>{user.name}</span>
              </div>

              {user.role !== "owner" && user.role !== "OWNER" && (
                <div className={styles.userActions}>
                  <button
                    type="button"
                    onClick={() =>
                      user.isMod ? removeMod(user.id) : openModModal(user.id)
                    }
                    className={user.isMod ? styles.isMod : styles.notMod}
                  >
                    {user.isMod ? "MODERATOR" : "DAJ MODA"}{" "}
                    {user.isMod ? (
                      <RemoveCircleIcon className={styles.icon} />
                    ) : (
                      <PersonAddIcon fontSize="inherit" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleBan(user.id, user.isBanned)}
                    className={styles.btnUnunban}
                  >
                    {user.isBanned ? "ODBANUJ" : "BAN"}{" "}
                    <BlockIcon fontSize="inherit" />
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      <div className={styles.reportedPosts}>
        <div className={styles.tableHeaderTitle}>ZGŁOSZONE POSTY</div>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <td>UŻYTKOWNIK</td>
              <td>POST</td>
              <td>ZASADA</td>
              <td>AKCJE</td>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.reporter}</td>
                <td>
                  <Link to={`/c/${communityName}?highlight=${report.post_id}`}>
                    {report.postTitle || "Zobacz post"}
                  </Link>
                </td>
                <td>{report.rule}</td>
                <td>
                  <div className={styles.actionsCell}>
                    {(role?.can_delete_posts || role?.role === "owner") && (
                      <button
                        className={styles.btnActionDelete}
                        onClick={() => handleDeletePost(report.post_id)}
                      >
                        USUŃ <DeleteIcon fontSize="inherit" />
                      </button>
                    )}
                    <button
                      className={styles.btnActionIgnore}
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      IGNORUJ <CheckIcon fontSize="inherit" />
                    </button>
                    {(role?.can_ban_users || role?.role === "owner") && (
                      <button
                        className={styles.btnActionDelete}
                        style={{ backgroundColor: "#ff4444" }}
                        onClick={() =>
                          handleToggleBan(report.reported_user_id, false)
                        }
                      >
                        BAN <GavelIcon fontSize="inherit" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <h3 className={styles.modalHeader}>UPRAWNIENIA</h3>
            <label className={styles.customCheckContainer}>
              <span>USUWANIE POSTÓW</span>
              <input
                type="checkbox"
                checked={tempPermissions.can_delete_posts}
                onChange={(e) =>
                  setTempPermissions({
                    ...tempPermissions,
                    can_delete_posts: e.target.checked,
                  })
                }
              />
            </label>
            <label className={styles.customCheckContainer}>
              <span>BANOWANIE</span>
              <input
                type="checkbox"
                checked={tempPermissions.can_ban_users}
                onChange={(e) =>
                  setTempPermissions({
                    ...tempPermissions,
                    can_ban_users: e.target.checked,
                  })
                }
              />
            </label>
            <label className={styles.customCheckContainer}>
              <span>ZARZĄDZANIE MODERATORAMI</span>
              <input
                type="checkbox"
                checked={tempPermissions.can_manage_mods}
                onChange={(e) =>
                  setTempPermissions({
                    ...tempPermissions,
                    can_manage_mods: e.target.checked,
                  })
                }
              />
            </label>
            <div className={styles.actionButtons}>
              <button className={styles.btnSubmit} onClick={saveModPermissions}>
                ZAPISZ <CheckIcon fontSize="small" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
