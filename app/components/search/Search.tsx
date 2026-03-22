import { useState } from 'react';
import styles from './Search.module.css';
import SearchIcon from '@mui/icons-material/Search';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState("");

    return(
            <div className={styles.searchBar}>
                <input 
                    placeholder="Wyszukaj..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <SearchIcon className={styles.searchIcon} />
            </div>
    )
}