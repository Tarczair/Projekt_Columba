import SearchIcon from '@mui/icons-material/Search';
import styles from "./Header.module.css";
import logo from "../img/golab.png";
import ReorderIcon from '@mui/icons-material/Reorder';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ChatIcon from '@mui/icons-material/Chat';
import { useState, useEffect, useRef } from 'react';

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


    return(
        <header className={styles.header}>
            <div className={styles.Columba}>
                <img src={logo} className={styles.logo} alt="logo" />
                <h1>Columbo</h1>
            </div>
            <div className={styles.searchWrapper}>
                <input type="text" className={styles.search} placeholder='Wyszukaj...' />
                <SearchIcon className={styles.icons} />
            </div>
            <div ref={menuRef}>
                <button className={styles.button} onClick={toogleMenu}><ReorderIcon className={styles.icons}/></button>

                {isMenuOpen && (
                    <div className={styles.menu}>
                        <button className={styles.menuOption}>REJESTRACJA/LOGIN <LoginIcon className={styles.menuIcons}/></button>
                        <button className={styles.menuOption}>PROFIL <PersonIcon className={styles.menuIcons}/></button>
                        <button className={styles.menuOption}>WYLOGUJ <LogoutIcon className={styles.menuIcons}/></button>
                        <button className={styles.menuOption}>ZAŁÓŻ SPOŁECZNOŚĆ <GroupAddIcon className={styles.menuIcons}/></button>
                        <button className={styles.menuOption}>TWOJE POSTY <ChatIcon className={styles.menuIcons}/></button>
                    </div>
                )}
            </div>
        </header>
    );
}