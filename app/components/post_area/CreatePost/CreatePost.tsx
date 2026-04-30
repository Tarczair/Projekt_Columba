import { useState, useRef, type FormEvent, useEffect } from "react";
import styles from "./CreatePost.module.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import Tag from "./Tag";
import { authEmitter } from "../../services/authEmitter";
import { useParams } from "react-router";

export default function CreatePost() {
  const { communityName } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isSpoiler, setIsSpoiler] = useState(false);
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Zamiast bezpośrednio czytać z localStorage, używamy authEmitter.getToken()
    // To gwarantuje, że zawsze pracujemy z aktualnym tokenem
    const token = authEmitter.getToken();

    if (!token) return alert("Musisz być zalogowany!");
    if (!title.trim()) return alert("Podaj tytuł posta!");
    if (!communityName) return alert("Błąd: Nie rozpoznano społeczności.");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("post", description);
    formData.append("community_name", communityName);
    formData.append("tags", JSON.stringify(selectedTags));
    formData.append("is_spoiler", String(isSpoiler));

    if (fileInputRef.current?.files?.[0]) {
      formData.append("image", fileInputRef.current.files[0]);
    }

    try {
      const response = await fetch("http://localhost:5000/api/addpost", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      if (response.ok) {
        alert("Post stworzony pomyślnie!");
        window.location.reload();
      } else {
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          alert(errData.error || "Błąd podczas tworzenia");
        } else {
          alert(
            `Błąd serwera: ${response.status} (Nie znaleziono ścieżki lub krytyczny błąd)`,
          );
        }
      }
    } catch (err) {
      console.error("Błąd połączenia:", err);
      alert("Błąd połączenia z serwerem. Upewnij się, że backend działa.");
    }
  };

  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsAuthorized(authEmitter.isAuthenticated());

    const handleAuthChange = (data: any) => {
      setIsAuthorized(data.isLoggedIn);
    };

    authEmitter.subscribe("authChange", handleAuthChange);

    return () => {
      authEmitter.unsubscribe("authChange", handleAuthChange);
    };
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isAuthorized) {
    return (
      <main className={styles.addCommunity}>
        <div className={styles.centeredMessage}>
          <h1 className={styles.errorTitle}>
            MUSISZ SIĘ ZALOGOWAĆ PRZED ZAŁOŻENIEM SPOŁECZNOŚCI
          </h1>
        </div>
      </main>
    );
  }

  return (
    <div className={styles.createPostContainer}>
      <h3 className={styles.mainTitle}>DODAJ POSTA</h3>

      <div className={styles.formWrapper}>
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
          <textarea
            className={styles.textContent}
            placeholder="TEXT..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

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

          <button className={styles.sendBtn} onClick={handleSubmit}>
            WYŚLIJ <ArrowForwardIcon className={styles.btnIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
