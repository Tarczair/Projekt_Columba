import { useState, useRef } from "react";
import styles from "./CreatePost.module.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import Tag from "./Tag";

export default function CreatePost() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isSpoiler, setIsSpoiler] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.createPostContainer}>
      <h3 className={styles.mainTitle}>DODAJ POSTA</h3>

      <div className={styles.formWrapper}>
        <select className={styles.communitySelect}>
          <option>WYBIERZ SPOŁECZNOŚĆ</option>
          <option>Elektronika</option>
          <option>Programowanie</option>
        </select>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="TEMAT..."
            className={styles.topicInput}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
          />
          <span className={styles.charCounter}>{title.length}/300</span>
        </div>

        <div className={styles.contentRow}>
          <textarea className={styles.textContent} placeholder="TEKST..." />

          <div className={styles.uploadBox} onClick={handleUploadClick}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*,video/*"
            />
            <ArrowForwardIcon
              className={styles.uploadIcon}
              style={{ transform: "rotate(-45deg) scale(2)" }}
            />
            <p>Prześlij zdjęcie/film</p>
          </div>
        </div>

        {selectedTags.length > 0 && (
          <div className={styles.selectedTagsContainer}>
            {selectedTags.map((tag) => (
              <div key={tag} className={styles.tagChip}>
                #{tag.toUpperCase()}
                <span
                  className={styles.removeTag}
                  onClick={() =>
                    setSelectedTags((prev) => prev.filter((t) => t !== tag))
                  }
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.actionButtons}>
          <button
            className={styles.blueBtn}
            onClick={() => setIsTagModalOpen(true)}
          >
            WYBIERZ TAGI <ArrowForwardIcon className={styles.btnIcon} />
          </button>
          {isTagModalOpen && (
            <Tag
              onClose={() => setIsTagModalOpen(false)}
              onConfirm={(tags) => {
                setSelectedTags(tags);
                setIsTagModalOpen(false);
              }}
              currentTags={selectedTags}
            />
          )}

          <label className={styles.spoilerLabel}>
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={() => setIsSpoiler(!isSpoiler)}
              className={styles.hiddenCheckbox}
            />
            <div className={styles.spoilerButton}>
              <span>SPOILER</span>
              <div
                className={`${styles.checkCircle} ${isSpoiler ? styles.active : ""}`}
              >
                <CheckIcon className={styles.checkIcon} />
              </div>
            </div>
          </label>

          <button className={styles.sendBtn}>
            WYŚLIJ <ArrowForwardIcon className={styles.btnIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
