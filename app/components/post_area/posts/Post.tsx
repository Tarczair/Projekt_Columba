import styles from "./Post.module.css";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CommentIcon from "@mui/icons-material/Comment";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";

import Comments from "./comments/Comments";
import { useEffect, useState } from "react";
import type { Rule } from "../PostArea";
import { authEmitter } from "../../services/authEmitter";

interface PostProps {
  postId: string;
  communityId: string;
  rules: Rule[];
  avatarPath: string;
  userName: string;
  title: string;
  image: string;
  text: string;
  tags: string[];
  upvotes: number;
  isRemoved: boolean;
  createdAt: string;
  comments: number;
  userVoteValue?: number;
}

export function Post({
  postId,
  communityId,
  rules = [],
  avatarPath,
  userName,
  title,
  image,
  text,
  tags,
  upvotes,
  isRemoved,
  createdAt,
  comments,
  userVoteValue = 0,
}: PostProps) {
  const [showComments, setShowComments] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [userVote, setUserVote] = useState(userVoteValue);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleVote = async (value: number) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Musisz być zalogowany!");

    // Jeśli klikasz to samo co już jest wybrane -> cofnij głos (0)
    // W przeciwnym razie ustaw nową wartość (-1 lub 1)
    const newValue = userVote === value ? 0 : value;

    const difference = newValue - userVote;
    const newUpvotes = currentUpvotes + difference;

    // Najpierw aktualizujemy lokalnie i EMITUJEMY do innych komponentów
    setCurrentUpvotes(newUpvotes);
    setUserVote(newValue);

    // Rozsyłamy info do wszystkich kopii tego posta na stronie (HomeFeed i PostArea)
    authEmitter.emit("postVoteUpdate", { postId, newValue, newUpvotes });

    try {
      const res = await fetch(
        `http://localhost:5000/api/posts/${postId}/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ value: newValue }),
        },
      );

      if (!res.ok) throw new Error();
    } catch (err) {
      const rollbackValue = userVote;
      const rollbackUpvotes = currentUpvotes;
      setCurrentUpvotes(rollbackUpvotes);
      setUserVote(rollbackValue);
      authEmitter.emit("postVoteUpdate", {
        postId,
        newValue: rollbackValue,
        newUpvotes: rollbackUpvotes,
      });
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedRuleId) return alert("Wybierz powód zgłoszenia!");

    const token = localStorage.getItem("token");
    if (!token) return alert("Musisz być zalogowany!");

    try {
      const res = await fetch(`http://localhost:5000/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          rule_id: selectedRuleId,
          community_id: communityId,
        }),
      });

      if (res.ok) {
        alert("Zgłoszenie wysłane.");
        setIsReportModalOpen(false);
      } else {
        alert("Błąd podczas zgłaszania");
      }
    } catch (err) {
      alert("Błąd serwera");
    }
  };

  const selectedRule = rules?.find(
    (r: any) =>
      String(r.id) === String(selectedRuleId) ||
      r.rule_title === selectedRuleId,
  );

  useEffect(() => {
    const handleRemoteVote = (data: {
      postId: string;
      newValue: number;
      newUpvotes: number;
    }) => {
      if (data.postId === postId) {
        setUserVote(data.newValue);
        setCurrentUpvotes(data.newUpvotes);
      }
    };

    authEmitter.subscribe("postVoteUpdate", handleRemoteVote);
    return () => authEmitter.unsubscribe("postVoteUpdate", handleRemoteVote);
  }, [postId]);

  useEffect(() => {
    setCurrentUpvotes(upvotes);
    setUserVote(userVoteValue);
  }, [upvotes, userVoteValue]);

  return (
    <div className={styles.post}>
      <div className={styles.header}>
        <div>
          <img className={styles.avatar} src={avatarPath} alt="avatarPath" />
          <h2 className={styles.text}>{userName}</h2>
          <h3 className={styles.text}>{createdAt}</h3>
        </div>
        <button className={styles.postOptions}>
          <MoreHorizIcon />
        </button>
      </div>
      {!isRemoved ? (
        <div className={styles.postContent}>
          <h2 className={styles.tytul}>{title}</h2>
          <p className={styles.textPost}>{text}</p>
          {image.length == 0 ? (
            <div></div>
          ) : (
            <img className={styles.postImage} src={image} alt="image" />
          )}
          <p className={styles.tags}>
            {tags.map((tag, i) => (
              <span key={tag}>
                #{tag}
                {i !== tags.length - 1 && " | "}
              </span>
            ))}
          </p>
        </div>
      ) : (
        <div className={styles.text}>Post został usunięty</div>
      )}
      <div className={styles.reactions}>
        <div className={styles.votes}>
          <button
            className={`${styles.vote} ${userVote === 1 ? styles.voteActiveUp : ""}`}
            onClick={() => handleVote(1)}
          >
            <ArrowUpwardIcon className={styles.icons} />
          </button>

          <p className={styles.text}>{currentUpvotes}</p>

          <button
            className={`${styles.vote} ${userVote === -1 ? styles.voteActiveDown : ""}`}
            onClick={() => handleVote(-1)}
          >
            <ArrowDownwardIcon className={styles.icons} />
          </button>
        </div>
        <button className={styles.button} onClick={toggleComments}>
          {comments}
          <CommentIcon className={styles.icons} />
        </button>

        <button
          className={styles.button}
          onClick={() => setIsReportModalOpen(true)}
        >
          <OutlinedFlagIcon className={styles.icons} />
          Zgłoś
        </button>
      </div>
      {showComments && <Comments />}
      {isReportModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.text} style={{ marginBottom: "10px" }}>
              Zgłoś ten post
            </h3>

            <select
              className={styles.reportSelect}
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
            >
              <option value="" disabled>
                Wybierz powód...
              </option>
              {rules?.map((rule) => (
                <option key={(rule as any).id} value={(rule as any).id}>
                  {rule.rule_title}
                </option>
              ))}
            </select>

            {selectedRule && (
              <div className={styles.ruleDescriptionBox}>
                <p className={styles.ruleDescriptionText}>
                  {selectedRule.description ||
                    "Brak dodatkowego opisu dla tej zasady."}
                </p>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setIsReportModalOpen(false)}
              >
                Anuluj
              </button>
              <button className={styles.submitBtn} onClick={handleSubmitReport}>
                Wyślij zgłoszenie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
