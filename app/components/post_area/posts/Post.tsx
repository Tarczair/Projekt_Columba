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
  
  // === NOWE STANY DLA ZGŁOSZEŃ ===
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | "other">("");
  const [customReason, setCustomReason] = useState("");

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleVote = async (value: number) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Musisz być zalogowany!");

    const newValue = userVote === value ? 0 : value;
    const difference = newValue - userVote;
    const newUpvotes = currentUpvotes + difference;

    setCurrentUpvotes(newUpvotes);
    setUserVote(newValue);

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
      setCurrentUpvotes(currentUpvotes);
      setUserVote(userVote);
      authEmitter.emit("postVoteUpdate", { postId, newValue: userVote, newUpvotes: currentUpvotes });
    }
  };

  // === POPRAWIONA FUNKCJA WYSYŁANIA ZGŁOSZENIA ===
  const handleSubmitReport = async () => {
    if (!selectedRuleId) return alert("Wybierz powód zgłoszenia!");
    if (selectedRuleId === "other" && !customReason.trim()) return alert("Opisz powód zgłoszenia!");

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
          community_id: communityId,
          // Jeśli 'other', wysyłamy null do rule_id, bo Postgres czeka na UUID lub null
          rule_id: selectedRuleId === "other" ? null : selectedRuleId,
          // Wysyłamy opis tylko jeśli wybrano 'other'
          description: selectedRuleId === "other" ? customReason : null,
        }),
      });

      if (res.ok) {
        alert("Zgłoszenie zostało wysłane.");
        setIsReportModalOpen(false);
        setSelectedRuleId("");
        setCustomReason("");
      } else {
        alert("Błąd podczas zgłaszania");
      }
    } catch (err) {
      alert("Błąd serwera");
    }
  };

  useEffect(() => {
    const handleRemoteVote = (data: any) => {
      if (data.postId === postId) {
        setUserVote(data.newValue);
        setCurrentUpvotes(data.newUpvotes);
      }
    };
    authEmitter.subscribe("postVoteUpdate", handleRemoteVote);
    return () => authEmitter.unsubscribe("postVoteUpdate", handleRemoteVote);
  }, [postId]);

  return (
    <div className={styles.post}>
      <div className={styles.header}>
        <div>
          <img className={styles.avatar} src={avatarPath} alt="avatar" />
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
          {image && <img className={styles.postImage} src={image} alt="post" />}
          <p className={styles.tags}>
            {tags?.map((tag, i) => (
              <span key={tag}>#{tag}{i !== tags.length - 1 && " | "}</span>
            ))}
          </p>
        </div>
      ) : (
        <div className={styles.text} style={{padding: '20px'}}>Post został usunięty</div>
      )}

      <div className={styles.reactions}>
        <div className={styles.votes}>
          <button className={`${styles.vote} ${userVote === 1 ? styles.voteActiveUp : ""}`} onClick={() => handleVote(1)}>
            <ArrowUpwardIcon className={styles.icons} />
          </button>
          <p className={styles.text}>{currentUpvotes}</p>
          <button className={`${styles.vote} ${userVote === -1 ? styles.voteActiveDown : ""}`} onClick={() => handleVote(-1)}>
            <ArrowDownwardIcon className={styles.icons} />
          </button>
        </div>

        <button className={styles.button} onClick={toggleComments}>
          {comments} <CommentIcon className={styles.icons} />
        </button>

        <button className={styles.button} onClick={() => setIsReportModalOpen(true)}>
          <OutlinedFlagIcon className={styles.icons} /> Zgłoś
        </button>
      </div>

      {showComments && <Comments />}

      {/* === NOWY MODAL ZGŁOSZEŃ (W STYLU ADMIN PANELU) === */}
      {isReportModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsReportModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalHeader}>ZGŁOŚ POST</h2>
            
            <div className={styles.permissionList}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>
                Dlaczego zgłaszasz ten materiał?
              </p>

              {/* LISTA ZASAD Z BAZY */}
              {rules?.map((rule: any) => (
                <label key={rule.id} className={styles.customCheckContainer}>
                  <span>{rule.rule_title}</span>
                  <input 
                    type="radio" 
                    name="report_reason" 
                    value={rule.id} 
                    checked={selectedRuleId === rule.id}
                    onChange={(e) => setSelectedRuleId(e.target.value)} 
                  />
                  <span className={styles.customCheckmark}></span>
                </label>
              ))}

              {/* KATEGORIA INNE - ZAWSZE NA DOLE */}
              <label className={styles.customCheckContainer}>
                <span>INNE / WŁASNY POWÓD</span>
                <input 
                  type="radio" 
                  name="report_reason" 
                  value="other" 
                  checked={selectedRuleId === "other"}
                  onChange={(e) => setSelectedRuleId(e.target.value)} 
                />
                <span className={styles.customCheckmark}></span>
              </label>

              {/* POLE TEKSTOWE DLA KATEGORII INNE */}
              {selectedRuleId === "other" && (
                <textarea 
                  className={styles.reportTextarea} 
                  placeholder="Opisz przewinienie..." 
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.modalBtnCancel} onClick={() => setIsReportModalOpen(false)}>
                ANULUJ
              </button>
              <button 
                className={styles.modalBtnConfirm} 
                onClick={handleSubmitReport}
                disabled={!selectedRuleId || (selectedRuleId === "other" && !customReason.trim())}
              >
                WYŚLIJ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}