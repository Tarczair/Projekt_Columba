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
import { authEmitter } from "../services/authEmitter"; //emiter który będzie przekazywać informacje o zmianie stanu logowania.

export function Header() {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toogleMenu = () => setMenuOpen(!isMenuOpen);

  const menuRef = useRef<HTMLDivElement>(null);

  // ===== ZMIANA: Inicjalizacja na false zamiast bezpośrednio na localStorage =====
  // STARY KOD (błąd "localStorage is not defined" na serwerze):
  // const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  // 
  // NOWY KOD (bezpieczny - localStorage sprawdzane tylko po stronie klienta):
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => { //to takie "centrum nasłuchowe" 
    // Zamiast ręcznego localStorage.getItem("token"), używamy metody z authEmitter
    // Ta metoda sprawdza czy token istnieje w localStorage
    if (typeof window !== "undefined") {
      setIsLoggedIn(authEmitter.isAuthenticated()); // true/false - czy użytkownik ma token
    }

    const handleAuthChange = () => {
      // Po każdej zmianie autoryzacji (login/logout), sprawdzamy ponownie
      setIsLoggedIn(authEmitter.isAuthenticated());
      //te podwójne !! to taki trik. Normalnie getItem zwraca albo null albo string, 
      // za pomocą pierwszego ! zmieniamy typ na przeciwny logiczny jednocześnie zmieniając to na boolean, 
      // następnie znowu odwracamy ale więc mamy wartość z poczatku ale w systemie boolean.
    };

    authEmitter.subscribe("authChange", handleAuthChange); //zasubskrybowanie czyli sprawienie że obserwator wysyła mu zmiane stanu. 

    return () => {
      authEmitter.unsubscribe("authChange", handleAuthChange); //funkcja czyszcząca, zabezpieczenie przed wyciekiem pamięci. 
    };
  }, []); //pusta tablica na końcu mówi że ma się wykonać tylko raz.



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
            {!isLoggedIn ? (  
            <Link to="/login" className={styles.menuOption}>
              REJESTRACJA/LOGIN <LoginIcon className={styles.menuIcons} />
            </Link>
            ) : (
            <>
            <Link to="/profile" className={styles.menuOption}>
              PROFIL <PersonIcon className={styles.menuIcons} />
            </Link>
            <button className={styles.menuOption} onClick={() => authEmitter.logout()}>
              WYLOGUJ <LogoutIcon className={styles.menuIcons} />
            </button>
            <Link to="/add_community" className={styles.menuOption}>
              ZAŁÓŻ SPOŁECZNOŚĆ <GroupAddIcon className={styles.menuIcons} />
            </Link>
            <button className={styles.menuOption}>
              TWOJE POSTY <ChatIcon className={styles.menuIcons} />
            </button>
            </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
