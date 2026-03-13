import SearchIcon from '@mui/icons-material/Search';
import styles from "./Header.module.css";
import logo from "../img/golab.png";
import ReorderIcon from '@mui/icons-material/Reorder';

export function Header() {
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
            <button className={styles.button}><ReorderIcon className={styles.icons}/></button>
        </header>
    );
}