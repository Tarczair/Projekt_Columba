import GavelIcon from "@mui/icons-material/Gavel";
import styles from "./Admin_panel.module.css";
import React, { useState } from "react";
import type { FormEvent } from "react";
import Search from "../search/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import type { UserRole } from "../post_area/PostArea";

interface Report {
  id: number;
  reporter: string;
  postTitle: string;
  rule: string;
}

interface ModeratorPanelProps {
  role?: UserRole | null;
}

export default function Moderator_panel({ role }: ModeratorPanelProps) {
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
        user.id === id ? { ...user, isBanned: !user.isBanned } : user,
      ),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Wysyłam do bazy:", users);
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

  return (
    <main className={styles.container}>
      <div>
        <div className={styles.banContainer}>
          <Search />
          <form onSubmit={handleSubmit} id="my-admin-form">
            <ul style={{ listStyle: "none", padding: 0 }}>
              {users.map((user) => (
                <li key={user.id} className={styles.userRow}>
                  <img
                    className={styles.avatar}
                    src={user.avatarPath}
                    alt="img"
                  />
                  <span className={styles.text}>{user.name}</span>

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
          </form>
        </div>
        <div className="buttons">
          <button
            type="submit"
            className={styles.btnSubmit}
            form="my-admin-form"
          >
            ZATWIERDŹ ZMIANY
          </button>
        </div>
      </div>
      <div>
        <div className={styles.reportedPosts}>
          <div className={styles.tableContainer}>
            <div className={styles.tableHeaderTitle}>ZGŁOSZONE POSTY</div>

            <form id="reports-form" onSubmit={handleSubmit}>
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
                          {role?.can_delete_posts && (
                            <button type="button" className={styles.btnUnban}>
                              USUŃ <DeleteIcon className={styles.icon} />
                            </button>
                          )}
                          {role?.can_ban_users && (
                            <button type="button" className={styles.btnUnban}>
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

        <div>
          <button
            type="submit"
            form="reports-form"
            className={styles.btnSubmit}
          >
            ZATWIERDŹ ZMIANY
          </button>
        </div>
      </div>
    </main>
  );
}
