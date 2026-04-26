import React, { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router"; 
import styles from "./Admin_panel.module.css";
import Search from "../search/Search";
import GavelIcon from "@mui/icons-material/Gavel";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import type { UserRole } from "../post_area/PostArea";

interface Report {
  id: string; 
  reporter: string;
  postTitle: string;
  rule: string;
  reported_user_id: string;
}

interface AdminPanelProps {
  role?: UserRole | null;
}

export default function Admin_panel({ role: initialRole }: AdminPanelProps) {
  // === 1. HOOKI I STANY ===
  const { communityId } = useParams(); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [communityName, setCommunityName] = useState("Ładowanie...");
  const [communityDesc, setCommunityDesc] = useState("Ładowanie opisu...");
  
  const [modModal, setModModal] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null,
  });

  const [tempPermissions, setTempPermissions] = useState({
    can_delete_posts: false,
    can_ban_users: false,
    can_manage_mods: false,
  });

  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // === 2. POBIERANIE DANYCH ===
  const fetchMembers = async () => {
    const token = localStorage.getItem("token");
    if (!communityId) return;

    try {
      const memRes = await fetch(`http://localhost:5000/api/communities/${communityId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const membersData = await memRes.json();
      setUsers(membersData.map((u: any) => ({
        id: u.id,
        name: u.username,
        avatarPath: u.avatar_url || "/img/pepe_placeholder.png",
        isMod: u.role === 'moderator',
        isBanned: u.is_banned,
        permissions: {
          can_delete_posts: u.can_delete_posts,
          can_ban_users: u.can_ban_users,
          can_manage_mods: u.can_manage_mods
        }
      })));
    } catch (err) {
      console.error("Błąd pobierania członków:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!communityId) return;

      try {
        // Pobieranie szczegółów społeczności [cite: 132, 133]
        const detailsRes = await fetch(`http://localhost:5000/api/communities-by-id/${communityId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          setCommunityName(details.name);
          setCommunityDesc(details.description || "");
        }

        // Pobieranie członków
        await fetchMembers();

        // Pobieranie zgłoszeń [cite: 136, 137]
        const repRes = await fetch(`http://localhost:5000/api/communities/${communityId}/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (repRes.ok) {
          const reportsData = await repRes.json();
          setReports(reportsData);
        }

      } catch (err) {
        console.error("Błąd podczas ładowania danych panelu:", err);
      }
    };

    fetchData();
  }, [communityId]);

  // === 3. FUNKCJE LOGICZNE ===

  const toggleBan = async (id: string) => {
    // Pobierz token autoryzacyjny z localStorage
    const token = localStorage.getItem("token");
    // Znajdź użytkownika w liście użytkowników na podstawie ID
    const user = users.find((u) => u.id === id);
    // Jeśli użytkownik nie istnieje, zakończ funkcję
    if (!user) return;

    // Sprawdź, czy użytkownik jest obecnie zbanowany
    const isCurrentlyBanned = user.isBanned;
    // Określ akcję na podstawie aktualnego statusu (ban lub unban)
    const action = isCurrentlyBanned ? "ODBANUJ" : "ZBANUJ";
    // Wyświetl okno potwierdzenia z odpowiednią akcją
    if (!window.confirm(`Czy na pewno chcesz ${action.toLowerCase()} tego użytkownika?`)) return;

    try {
      // Wyślij POST request do odpowiedniego endpointu: ban-user lub unban-user
      const endpoint = isCurrentlyBanned ? "unban-user" : "ban-user";
      const res = await fetch(`http://localhost:5000/api/communities/${communityId}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: id })
      });

      // Jeśli request się powiódł (status 200-299)
      if (res.ok) {
        // Odśwież dane z backendu
        await fetchMembers();
        // Wyświetl alert z informacją o sukcesie
        alert(`Użytkownik został ${isCurrentlyBanned ? "odbanowany" : "zbanowany"}!`);
      } else {
        // Jeśli request nie powiódł się, wyświetl alert o błędzie
        alert("Błąd podczas zmiany statusu użytkownika");
      }
    } catch (err) {
      // W przypadku błędu połączenia, zaloguj błąd do konsoli
      console.error("Błąd połączenia:", err);
      // Wyświetl alert o błędzie połączenia
      alert("Błąd połączenia z serwerem");
    }
  };

  const openModModal = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setTempPermissions(user.permissions || {
        can_delete_posts: false,
        can_ban_users: false,
        can_manage_mods: false,
      });
      setModModal({ isOpen: true, userId: id });
    }
  };

  const saveModPermissions = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/communities/${communityId}/members/${modModal.userId}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: 'moderator',
          ...tempPermissions
        })
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === modModal.userId ? { ...u, isMod: true, permissions: tempPermissions } : u));
        setModModal({ isOpen: false, userId: null });
        alert("Uprawnienia zostały zapisane!");
      }
    } catch (err) {
      alert("Błąd połączenia z serwerem");
    }
  };

  const removeMod = (id: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => user.id === id ? { ...user, isMod: false } : user)
    );
  };

  // USUNIĘCIE (ZIGNOROWANIE) ZGŁOSZENIA [cite: 147, 148, 149]
  const handleDeleteReport = async (reportId: string) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Czy na pewno chcesz zignorować to zgłoszenie?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
      }
    } catch (err) {
      console.error("Błąd usuwania zgłoszenia:", err);
    }
  };

  // BANOWANIE OSOBY ZGŁOSZONEJ [cite: 151, 152, 153, 154]
  const handleBanReportedUser = async (reportId: string, reportedUserId: string) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Zbanować winowajcę?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/communities/${communityId}/ban-reported`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: reportedUserId, reportId: reportId })
      });
      if (res.ok) {
        setReports((prev) => prev.filter(r => r.reported_user_id !== reportedUserId));
        alert("Użytkownik zbanowany!");
      }
    } catch (err) {
      alert("Błąd połączenia");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    alert("Główne ustawienia społeczności zostały zapisane!");
  };

  const toggleTag = (id: number) => {
    setTags((prev) => prev.map((tag) => tag.id === id ? { ...tag, isSelected: !tag.isSelected } : tag));
  };

  const selectedTagsCount = tags.filter((t) => t.isSelected).length;

  return (
    <main className={styles.containerAdmin}>
      <div className={styles.firstSection}>
        <form onSubmit={handleSubmit} id="community-edit-form" className={styles.editForm}>
          <div className={styles.communityInfoCol}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className={styles.topicInput}
                maxLength={300}
              />
              <span className={styles.charCounter}>{communityName.length}/300</span>
            </div>

            <textarea
              className={styles.textContent}
              value={communityDesc}
              onChange={(e) => setCommunityDesc(e.target.value)}
            />

            <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" />
              <ArrowForwardIcon className={styles.uploadIcon} style={{ transform: "rotate(-45deg) scale(1.5)" }} />
              <p>Wybierz ikonę społeczności</p>
            </div>
          </div>

          <div className={styles.tagsCol}>
            <div className={styles.tagsHeader}>TAGI {selectedTagsCount}/{tags.length}</div>
            <div className={styles.searchBar}><Search /></div>
            <div className={styles.tagList}>
              {tags.map((tag) => (
                <div key={tag.id} className={styles.tagItem} onClick={() => toggleTag(tag.id)}>
                  <span>{tag.name}</span>
                  <div className={`${styles.checkCircle} ${tag.isSelected ? styles.active : ""}`}><CheckIcon /></div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className={styles.usersCol}>
          <div className={styles.banContainer}>
            <Search />
            <ul style={{ listStyle: "none", padding: 0 }}>
              {users.map((user) => (
                <li key={user.id} className={styles.userRow}>
                  <img className={styles.avatar} src={user.avatarPath} alt="img" />
                  <span className={styles.name}>{user.name}</span>

                  <button
                    type="button"
                    onClick={() => user.isMod ? removeMod(user.id) : openModModal(user.id)}
                    className={user.isMod ? styles.isMod : styles.notMod}
                    disabled={user.isBanned}
                  >
                    {user.isMod ? "ODBIERZ MODA" : "DAJ MODA"}
                    <PersonAddIcon className={styles.icon} />
                  </button>

                  <button type="button" onClick={() => toggleBan(user.id)} className={styles.btnUnban}>
                    {user.isBanned ? "ODBANUJ" : "BAN"}
                    <GavelIcon className={styles.icon} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.actionButtons}>
            <button type="submit" className={styles.btnSubmit} form="community-edit-form">ZATWIERDŹ ZMIANY</button>
          </div>
        </div>
      </div>

      <div className={styles.secondSection}>
        <div className={styles.reportedPosts}>
          <div className={styles.tableContainer}>
            <div className={styles.tableHeaderTitle}>ZGŁOSZONE POSTY</div>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <td>NAZWA ZGŁASZAJĄCEGO</td>
                  <td>TYTUŁ POSTA</td>
                  <td>ZASADA</td>
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
                        <button 
                          type="button" 
                          className={styles.btnUnban} 
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          USUŃ <DeleteIcon className={styles.icon} />
                        </button>

                        <button 
                          type="button" 
                          className={styles.btnUnban} 
                          onClick={() => handleBanReportedUser(report.id, report.reported_user_id)}
                        >
                          BAN <GavelIcon className={styles.icon} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setModModal({ isOpen: false, userId: null })}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>UPRAWNIENIA MODERATORA</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'white' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>USUWANIE POSTÓW</span>
                <input 
                  type="checkbox" 
                  checked={tempPermissions.can_delete_posts}
                  onChange={(e) => setTempPermissions({...tempPermissions, can_delete_posts: e.target.checked})}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>BANOWANIE UŻYTKOWNIKÓW</span>
                <input 
                  type="checkbox" 
                  checked={tempPermissions.can_ban_users}
                  onChange={(e) => setTempPermissions({...tempPermissions, can_ban_users: e.target.checked})}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ZARZĄDZANIE MODAMI</span>
                <input 
                  type="checkbox" 
                  checked={tempPermissions.can_manage_mods}
                  onChange={(e) => setTempPermissions({...tempPermissions, can_manage_mods: e.target.checked})}
                />
              </label>
            </div>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className={styles.btnUnban} onClick={() => setModModal({ isOpen: false, userId: null })}>ANULUJ</button>
              <button type="button" className={styles.btnSubmit} onClick={saveModPermissions}>ZATWIERDŹ</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}