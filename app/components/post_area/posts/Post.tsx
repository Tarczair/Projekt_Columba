import styles from "./Post.module.css"
import avatarPath from "../../img/pepe_placeholder.png"
import image from "../../img/golab.png"
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CommentIcon from '@mui/icons-material/Comment';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';

export function Post({ /*avatarPath, userName, title, image, text, tags, upvotes, isRemoved, createdAt, comments*/ }) {
    const userName = "Przykładowy użytkownik";
    const createdAt = "4 godz. temu";
    const upvotes = 46;
    const comments = 46;

    return(
        <div className={styles.post}>
            <div className={styles.header}>
                <div>
                    <img className={styles.avatar} src={avatarPath} alt="avatarPath" />
                    <h2 className={styles.text}>{userName}</h2>
                    <h3 className={styles.text}>{createdAt}</h3>
                </div>
                <button className={styles.postOptions}><MoreHorizIcon/></button>
            </div>
            <div className={styles.postContent}>
                <p className={styles.text}>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Officiis quaerat officia quia debitis modi, ratione, 
                    rem asperiores mollitia ab nostrum beatae. Iste sint, ab, vero, soluta a rem assumenda quam architecto provident possimus earum est 
                    temporibus quod voluptatum quibusdam dolorem.
                </p>
                <img className={styles.postImage} src={image} alt="image" />
            </div>
            <div className={styles.reactions}>
                <div className={styles.votes}>
                    <button className={styles.vote}><ArrowUpwardIcon className={styles.icons}/></button>
                    <p className={styles.text}>{upvotes}</p>
                    <button className={styles.vote}><ArrowDownwardIcon className={styles.icons}/></button>
                </div>
                <button className={styles.button}>{comments}<CommentIcon className={styles.icons}/></button>
                <button className={styles.button}><OutlinedFlagIcon className={styles.icons}/>Zgłoś</button>
            </div>
        </div>
    );
}