import styles from "./Post.module.css"
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CommentIcon from '@mui/icons-material/Comment';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';

interface PostProps {
  avatarPath: string
  userName: string
  title: string
  image: string
  text: string
  tags: string[]
  upvotes: number
  isRemoved: boolean
  createdAt: string
  comments: number
}

export function Post({ avatarPath, userName, title, image, text, tags, upvotes, isRemoved, createdAt, comments } : PostProps) {

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
            {!isRemoved ? <div className={styles.postContent}>
                <h2 className={styles.tytul}>
                    {title}
                </h2>
                <p className={styles.textPost}>{text}
                </p>
                {image.length == 0 ? <div></div> : <img className={styles.postImage} src={image} alt="image" />}
                <p className={styles.tags}>{tags.map((tag, i) => (
                    <span key={tag}>
                    #{tag}{i !== tags.length - 1 && " | "}
                    </span>
                ))}
                </p>
            </div> : <div className={styles.text}>Post został usunięty</div>}
            
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