import styles from "./Header.module.css";
import logo from "../../../public/img/golab.png";
import ReorderIcon from "@mui/icons-material/Reorder";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ChatIcon from "@mui/icons-material/Chat";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import Search from "../search/Search";

export function Header() {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toogleMenu = () => setMenuOpen(!isMenuOpen);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.Columba}>
        <img src={logo} className={styles.logo} alt="logo" />
        <h1>Columba</h1>
      </Link>

      <Search />

      <div ref={menuRef}>
        <button className={styles.button} onClick={toogleMenu}>
          <ReorderIcon className={styles.icons} />
        </button>

        {isMenuOpen && (
          <div className={styles.menu}>
            <Link to="/login" className={styles.menuOption}>
              REJESTRACJA/LOGIN <LoginIcon className={styles.menuIcons} />
            </Link>
            <Link to="/profile" className={styles.menuOption}>
              PROFIL <PersonIcon className={styles.menuIcons} />
            </Link>
            <button className={styles.menuOption}>
              WYLOGUJ <LogoutIcon className={styles.menuIcons} />
            </button>
            <button className={styles.menuOption}>
              ZAŁÓŻ SPOŁECZNOŚĆ <GroupAddIcon className={styles.menuIcons} />
            </button>
            <button className={styles.menuOption}>
              TWOJE POSTY <ChatIcon className={styles.menuIcons} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
