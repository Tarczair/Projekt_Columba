import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import Search from "./Search";
import styles from "./GlobalSearch.module.css";

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "communities">(
    "posts",
  );
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/search?q=${searchTerm}&type=${activeTab}`,
        );

        if (!res.ok) {
          throw new Error(`Serwer zwrócił błąd: ${res.status}`);
        }

        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm, activeTab]);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <Search
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && searchTerm && (
        <div className={styles.dropdown}>
          <div className={styles.tabs}>
            <button
              className={activeTab === "users" ? styles.active : ""}
              onClick={() => setActiveTab("users")}
            >
              UŻYTKOWNICY
            </button>
            <button
              className={activeTab === "posts" ? styles.active : ""}
              onClick={() => setActiveTab("posts")}
            >
              POSTY
            </button>
            <button
              className={activeTab === "communities" ? styles.active : ""}
              onClick={() => setActiveTab("communities")}
            >
              SPOŁECZNOŚCI
            </button>
          </div>

          <div className={styles.results}>
            {results.map((item: any) => (
              <div
                key={item.id}
                className={styles.resultItem}
                onClick={() => setIsOpen(false)}
              >
                {activeTab === "posts" && (
                  <Link
                    to={`/c/${item.communityName}?highlight=${item.id}`}
                    className={styles.link}
                  >
                    <img
                      src={item.communityAvatar || "/img/pepe_placeholder.png"}
                      alt=""
                    />
                    <div>
                      <p className={styles.title}>{item.title}</p>
                      <span className={styles.sub}>c/{item.communityName}</span>
                    </div>
                  </Link>
                )}
                {activeTab === "communities" && (
                  <Link to={`/c/${item.name}`} className={styles.link}>
                    <img
                      src={item.avatar || "/img/pepe_placeholder.png"}
                      alt=""
                    />
                    <span>c/{item.name}</span>
                  </Link>
                )}
                {activeTab === "users" && (
                  <Link to={`/u/${item.username}`} className={styles.link}>
                    <img
                      src={item.avatar || "/img/pepe_placeholder.png"}
                      alt=""
                    />
                    <span>{item.username}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
