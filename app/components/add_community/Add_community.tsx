import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./Add_community.module.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import Search from "../search/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import { authEmitter } from "../services/authEmitter";

interface Rule {
  rule_title: string;
  description: string;
}

export default function Add_community() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/tags");
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data);
        }
      } catch (error) {
        console.error("Błąd pobierania tagów:", error);
      }
    };
    fetchTags();
  }, []);

  const [rules, setRules] = useState<Rule[]>([
    { rule_title: "", description: "" },
  ]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleUploadClick = () => fileInputRef.current?.click();

  const addRule = () =>
    setRules([...rules, { rule_title: "", description: "" }]);

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = authEmitter.getToken();
    if (!token) {
      alert("Musisz być zalogowany!");
      return;
    }

    if (!title.trim()) return alert("Podaj nazwę społeczności!");

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);
    const validRules = rules
      .filter((r) => r.rule_title.trim() !== "")
      .map((r) => ({
        rule_title: r.rule_title,
        description: r.description,
      }));

    formData.append("rules", JSON.stringify(validRules));
    formData.append("tags", JSON.stringify(selectedTags));

    if (fileInputRef.current?.files?.[0]) {
      formData.append("avatar", fileInputRef.current.files[0]);
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/createcommunity",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const contentType = response.headers.get("content-type");

      if (response.ok) {
        alert("Społeczność stworzona pomyślnie!");
      } else {
        const errData = await response.json();
        alert(errData.error || "Błąd podczas tworzenia");
      }
    } catch (err) {
      console.error("Błąd połączenia:", err);
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
    <main className={styles.addCommunity}>
      <div className={styles.container}>
        <h3 className={styles.mainTitle}>DODAJ SPOŁECZNOŚĆ</h3>

        <div className={styles.formWrapper}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="NAZWA SPOŁECZNOŚCI"
              className={styles.topicInput}
              maxLength={300}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <span className={styles.charCounter}>{title.length}/300</span>
          </div>

          <div className={styles.contentRow}>
            <textarea
              className={styles.textContent}
              placeholder="OPIS SPOŁECZNOŚCI..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className={styles.uploadBox} onClick={handleUploadClick}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
              />
              <ArrowForwardIcon
                className={styles.uploadIcon}
                style={{ transform: "rotate(-45deg)" }}
              />
              <p>Wybierz ikonę</p>
            </div>
          </div>

          <div className={styles.rulesSection}>
            <h4 className={styles.sectionLabel}>REGULAMIN (ZASADY)</h4>
            {rules.map((rule, index) => (
              <div key={index} className={styles.ruleItem}>
                <div className={styles.ruleHeader}>
                  <input
                    type="text"
                    placeholder={`Zasada #${index + 1}`}
                    className={styles.ruleTitleInput}
                    value={rule.rule_title}
                    onChange={(e) =>
                      updateRule(index, "rule_title", e.target.value)
                    }
                  />
                  {rules.length > 1 && (
                    <DeleteIcon
                      className={styles.deleteIcon}
                      onClick={() => removeRule(index)}
                    />
                  )}
                </div>
                <textarea
                  placeholder="Opis zasady..."
                  className={styles.ruleDescInput}
                  value={rule.description}
                  onChange={(e) =>
                    updateRule(index, "description", e.target.value)
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addRuleBtn}
              onClick={addRule}
            >
              + DODAJ KOLEJNĄ ZASADĘ
            </button>
          </div>

          <div className={styles.tagSection}>
            <h4 className={styles.sectionLabel}>
              WYBIERZ TAGI ({selectedTags.length}/3)
            </h4>
            <Search
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
            />
            <div className={styles.tagList}>
              {filteredTags.map((tag) => (
                <div
                  key={tag}
                  className={styles.tagItem}
                  onClick={() => toggleTag(tag)}
                >
                  <span>{tag.toUpperCase()}</span>
                  <div
                    className={`${styles.checkCircle} ${
                      selectedTags.includes(tag) ? styles.active : ""
                    }`}
                  >
                    <CheckIcon className={styles.checkIcon} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formFooter}>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleSubmit}
            >
              STWÓRZ SPOŁECZNOŚĆ
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
