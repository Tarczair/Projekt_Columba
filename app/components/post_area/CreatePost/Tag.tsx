import { useState } from "react";
import styles from "./Tag.module.css";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import Search from "../../search/Search";

interface TagProps {
  onClose: () => void;
  onConfirm: (selected: string[]) => void;
  currentTags: string[];
}

const ALL_TAGS = [
  "Elektronika",
  "Programowanie",
  "Lutowanie",
  "Arduino",
  "C++",
  "Vite",
  "React",
];

export default function Tag({ onClose, onConfirm, currentTags }: TagProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filteredTags = ALL_TAGS.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>WYBIERZ TAGI DLA POSTA</h3>

        <Search />

        <div className={styles.tagList}>
          {filteredTags.map((tag) => (
            <div
              key={tag}
              className={styles.tagItem}
              onClick={() => toggleTag(tag)}
            >
              <span>{tag.toUpperCase()}</span>
              <div
                className={`${styles.checkCircle} ${selectedTags.includes(tag) ? styles.active : ""}`}
              >
                <CheckIcon className={styles.checkIcon} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.backBtn} onClick={onClose}>
            WRÓĆ
          </button>
          <button
            className={styles.confirmBtn}
            onClick={() => onConfirm(selectedTags)}
          >
            POTWIERDŹ
          </button>
        </div>
      </div>
    </div>
  );
}
