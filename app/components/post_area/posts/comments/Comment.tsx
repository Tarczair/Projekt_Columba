import styles from "./Comments.module.css";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CommentIcon from "@mui/icons-material/Comment";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";

interface CommentProps {
  author: string;
  time: string;
  content: string;
  upvotes: number;
  repliesCount: number;
  avatarPath: string;
  children?: React.ReactNode; // Żeby zrobić drzewo
}

export default function Comment({
  author,
  time,
  content,
  upvotes,
  repliesCount,
  avatarPath,
  children,
}: CommentProps) {
  return (
    <div className={styles.commentWrapper}>
      <div className={styles.commentHeader}>
        <div className={styles.commentAuthorInfo}>
          <img className={styles.commentAvatar} src={avatarPath} alt="avatar" />
          <span className={styles.commentAuthor}>{author}</span>
          <span className={styles.commentTime}>{time}</span>
        </div>
        <button className={styles.iconButton}>
          <MoreHorizIcon />
        </button>
      </div>

      <div className={styles.commentContentBox}>
        <p className={styles.commentContentText}>{content}</p>
      </div>

      <div className={styles.commentReactions}>
        <div className={styles.votes}>
          <button className={styles.vote}>
            <ArrowUpwardIcon className={styles.icons} />
          </button>
          <span className={styles.text}>{upvotes}</span>
          <button className={styles.vote}>
            <ArrowDownwardIcon className={styles.icons} />
          </button>
        </div>
        <button className={styles.button}>
          {repliesCount} <CommentIcon className={styles.icons} />
        </button>
        <button className={styles.button}>
          <OutlinedFlagIcon className={styles.icons} /> Zgłoś
        </button>
      </div>

      {children && <div className={styles.nestedReplies}>{children}</div>}
    </div>
  );
}
