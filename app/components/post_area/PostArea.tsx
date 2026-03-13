import styles from "./PostArea.module.css";
import pepe from "../img/pepe_placeholder.png"
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Post } from "./posts/Post";

export function PostArea() {


    return(
        <div className={styles.pageWrapper}>
            <div className={styles.postArea}>
                <div className={styles.community}>
                    <div>
                        <img src={pepe} className={styles.communityLogo} alt="community logo" />
                        <h1 className={styles.text}>Przykładowa społeczność</h1>
                        <SettingsIcon className={styles.icons}/>
                    </div>
                    <button className={styles.button}>Dodaj post <AddCircleOutlineIcon className={styles.icons}/></button>
                    <button className={styles.button}>Dołącz <PersonAddIcon className={styles.icons}/></button>
                </div>
                <Post></Post>
            </div>
        </div>
    );
}