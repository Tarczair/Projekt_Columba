import React, { useState, useRef } from "react";
import type { FormEvent } from "react";
import styles from "./Admin_panel.module.css";
import Search from "../search/Search";
import GavelIcon from "@mui/icons-material/Gavel";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import type { UserRole } from "../post_area/PostArea";

interface Report {
  id: number;
  reporter: string;
  postTitle: string;
  rule: string;
}

interface AdminPanelProps {
  role?: UserRole | null;
}

export default function Admin_panel({ role }: AdminPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [communityName, setCommunityName] = useState(
    "AKTUALNA NAZWA SPOŁECZNOŚCI",
  );
  const [communityDesc, setCommunityDesc] = useState(
    "Aktualny opis społeczności załadowany z bazy...",
  );

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Bardzo dluga nazwa uzytkownika do testowaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa UŻYTKOWNIK 1",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 2,
      name: "UŻYTKOWNIK 2",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: true,
      isMod: false,
    },
    {
      id: 3,
      name: "UŻYTKOWNIK 3",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 4,
      name: "UŻYTKOWNIK 4",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 5,
      name: "UŻYTKOWNIK 5",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: true,
      isMod: false,
    },
    {
      id: 6,
      name: "UŻYTKOWNIK 6",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: true,
      isMod: false,
    },
    {
      id: 7,
      name: "UŻYTKOWNIK 7",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 8,
      name: "UŻYTKOWNIK 8",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: true,
      isMod: false,
    },
    {
      id: 9,
      name: "UŻYTKOWNIK 9",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 10,
      name: "UŻYTKOWNIK 10",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 11,
      name: "UŻYTKOWNIK 11",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 12,
      name: "UŻYTKOWNIK 12",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: true,
      isMod: false,
    },
    {
      id: 13,
      name: "UŻYTKOWNIK 13",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: false,
      isMod: false,
    },
    {
      id: 14,
      name: "UŻYTKOWNIK 14",
      avatarPath: "/img/pepe_placeholder.png",
      isBanned: true,
      isMod: false,
    },
  ]);

  const toggleBan = (id: number) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id
          ? { ...user, isMod: false, isBanned: !user.isBanned }
          : user,
      ),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const selectedTags = tags.filter((t) => t.isSelected).map((t) => t.name);

    console.log("Wysyłam do bazy:", {
      communityName,
      communityDesc,
      selectedTags,
      users,
    });

    try {
      alert("Zmiany zostały zapisane!");
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
  };

  const reports: Report[] = [
    {
      id: 1,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
    {
      id: 2,
      reporter: "NAZWA ZGŁASZAJĄCEGO",
      postTitle: "TYTUŁ ZGŁOSZONEGO POSTA",
      rule: "ZASADA NR 1",
    },
  ];

  const [tags, setTags] = useState([
    { id: 1, name: "TAG 1", isSelected: true },
    { id: 2, name: "TAG 2", isSelected: false },
    { id: 3, name: "TAG 3", isSelected: true },
    { id: 4, name: "TAG 4", isSelected: true },
    { id: 5, name: "TAG 5", isSelected: false },
  ]);

  const selectedTagsCount = tags.filter((t) => t.isSelected).length;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toggleTag = (id: number) => {
    setTags((prev) =>
      prev.map((tag) =>
        tag.id === id ? { ...tag, isSelected: !tag.isSelected } : tag,
      ),
    );
  };

  const toggleMod = (id: number) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, isMod: !user.isMod } : user,
      ),
    );
  };

  return (
    <main className={styles.containerAdmin}>
      <div className={styles.firstSection}>
        <form
          onSubmit={handleSubmit}
          id="community-edit-form"
          className={styles.editForm}
        >
          <div className={styles.communityInfoCol}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className={styles.topicInput}
                maxLength={300}
                placeholder="Zmień nazwę społeczności..."
              />
              <span className={styles.charCounter}>
                {communityName.length}/300
              </span>
            </div>

            <textarea
              className={styles.textContent}
              value={communityDesc}
              onChange={(e) => setCommunityDesc(e.target.value)}
              placeholder="Zmień opis społeczności..."
            />

            <div className={styles.uploadBox} onClick={handleUploadClick}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
              />
              <ArrowForwardIcon
                className={styles.uploadIcon}
                style={{ transform: "rotate(-45deg) scale(1.5)" }}
              />
              <p>
                Wybierz ikonę
                <br />
                społeczności
              </p>
            </div>
          </div>

          <div className={styles.tagsCol}>
            <div className={styles.tagsHeader}>
              ZMIEŃ TAGI DLA SPOŁECZNOŚCI {selectedTagsCount}/{tags.length}
            </div>
            <div className={styles.searchBar}>
              <Search />
            </div>
            <div className={styles.tagList}>
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className={styles.tagItem}
                  onClick={() => toggleTag(tag.id)}
                >
                  <span>{tag.name}</span>
                  <div
                    className={`${styles.checkCircle} ${tag.isSelected ? styles.active : ""}`}
                  >
                    <CheckIcon />
                  </div>
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
                  <img
                    className={styles.avatar}
                    src={user.avatarPath}
                    alt="img"
                  />
                  <span className={styles.name}>{user.name}</span>

                  {role?.can_manage_mods && (
                    <button
                      type="button"
                      onClick={() => toggleMod(user.id)}
                      className={user.isMod ? styles.isMod : styles.notMod}
                      disabled={user.isBanned}
                    >
                      {user.isMod
                        ? "ODBIERZ MODERATORA"
                        : "DODAJ JAKO MODERATORA"}
                      <PersonAddIcon className={styles.icon} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleBan(user.id)}
                    className={styles.btnUnban}
                  >
                    {user.isBanned ? "ODBANUJ" : "BAN"}
                    <GavelIcon className={styles.icon} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.actionButtons}>
            <button
              type="submit"
              className={styles.btnSubmit}
              form="community-edit-form"
            >
              ZATWIERDŹ ZMIANY
            </button>
          </div>
        </div>
      </div>

      <div className={styles.secondSection}>
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
                          <button type="button" className={styles.btnUnban}>
                            USUŃ <DeleteIcon className={styles.icon} />
                          </button>
                          <button type="button" className={styles.btnUnban}>
                            BAN <GavelIcon className={styles.icon} />
                          </button>
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
    </main>
  );
}
