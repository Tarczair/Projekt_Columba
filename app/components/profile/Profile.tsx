import styles from "./Profile.module.css";
import Search from "../search/Search";
import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CommentIcon from "@mui/icons-material/Comment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { authEmitter } from "../services/authEmitter"; // globalny manager autoryzacji
import { Link } from "react-router";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  created_at: string;
  communities: any[];
  posts: any[];
  createdCommunities: any[];
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCommunities, setShowCommunities] = useState(true);
  const [showCreatedCommunities, setShowCreatedCommunities] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // ===== UŻYWANIE: authEmitter.getToken() =====
      // Zamiast bezpośredniego localStorage.getItem("token"),
      // używamy metody z authEmitter która:
      // - Sprawdza czy jesteśmy po stronie klienta (typeof window !== "undefined")
      // - Zwraca token albo null jeśli nie zalogowany
      const token = authEmitter.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
        }
      } catch (err) {
        console.error("Błąd pobierania profilu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLeaveCommunity = async (communityName: string) => {
    if (!communityName) return;

    const fetchLeaveCommunity = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/leavecommunity",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: communityName }),
          },
        );

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error);
          } else {
            throw new Error(`Błąd serwera (status ${response.status})`);
          }
        }

        if (response.ok) {
          setUser((prevUser) => {
            if (!prevUser) return null;
            return {
              ...prevUser,
              communities: prevUser.communities.filter(
                (c) => c.name !== communityName,
              ),
            };
          });

          alert("Opuściłeś społeczność!");
        }

        const data = await response.json();
      } catch (err: any) {
        err.message;
      }
    };

    await fetchLeaveCommunity();
  };

  const toggleCommunities = () => {
    setShowCommunities(true);
    setShowCreatedCommunities(false);
    setShowPosts(false);
  };

  const toggleCreatedCommunities = () => {
    setShowCreatedCommunities(true);
    setShowCommunities(false);
    setShowPosts(false);
  };

  const togglePosts = () => {
    setShowPosts(true);
    setShowCommunities(false);
    setShowCreatedCommunities(false);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) return;

    const formData = new FormData();
    formData.append("username", user?.username || "");
    formData.append("bio", user?.bio || "");

    if (fileInputRef.current?.files?.[0]) {
      formData.append("avatar", fileInputRef.current.files[0]);
    } else {
      formData.append("avatar_url", user?.avatar || "");
    }

    try {
      const response = await fetch("http://localhost:5000/api/update_profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("Profil został zaktualizowany!");
        setUser((prevUser) => ({
          ...prevUser,
          ...data.user,
          created_at: prevUser?.created_at,
        }));
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        alert(data.error || "Wystąpił błąd");
      }
    } catch (err) {
      console.error("Błąd sieci:", err);
      alert("Błąd połączenia z serwerem");
    }
  };

  if (loading) return <div className={styles.site}>Ładowanie profilu...</div>;
  if (!user)
    return (
      <main className={styles.addCommunity}>
        <div className={styles.centeredMessage}>
          <h1 className={styles.errorTitle}>
            MUSISZ SIĘ ZALOGOWAĆ ABY SPRAWDZIĆ PROFIL
          </h1>
        </div>
      </main>
    );

  return (
    <div className={styles.site}>
      <form className={styles.userinfo} onSubmit={handleSubmit}>
        <div className={styles.firstSection}>
          <img
            className={styles.avatar}
            src={user.avatar || "/img/pepe_placeholder.png"}
            alt="Avatar"
          />
          <input
            className={styles.input}
            type="text"
            name="username"
            value={user.username}
            onChange={handleInputChange}
          />
          <div className={styles.name}>
            {/*
                W tym przypadku używamy user z API bo chcemy aktualne dane.
            */}
            <p className={styles.text}>{user.username?.length || 0}/300</p>
            <p className={styles.date}>
              Dołączono: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className={styles.secondSection}>
          <div className={styles.inputs}>
            <textarea
              className={styles.inputDesc}
              name="bio"
              value={user.bio || ""}
              placeholder="Opowiedz coś o sobie..."
              onChange={handleInputChange}
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
                style={{ transform: "rotate(-45deg) scale(2)" }}
              />
              <p>Prześlij zdjęcie/film</p>
            </div>
          </div>

          <p className={styles.text}>{user.email}</p>
          <input
            className={styles.submit}
            type="submit"
            value="Zatwierdź zmiany"
          />
        </div>
      </form>

      <div className={styles.listComm}>
        <div className={styles.header}>
          <Search />
          <div className={styles.options}>
            <button
              onClick={toggleCommunities}
              className={showCommunities ? styles.active : ""}
            >
              TWOJE SPOŁECZNOŚCI
            </button>
            <button
              onClick={togglePosts}
              className={showPosts ? styles.active : ""}
            >
              TWOJE POSTY
            </button>
            <button
              onClick={toggleCreatedCommunities}
              className={showCreatedCommunities ? styles.active : ""}
            >
              ZAŁOŻONE SPOŁECZNOŚCI
            </button>
          </div>
        </div>

        {showCommunities && (
          <ul className={styles.list}>
            {user.communities?.map((comm, index) => (
              <li className={styles.listElement} key={comm.id || index}>
                <img
                  className={styles.smallAvatar}
                  src={comm.avatar || "/img/pepe_placeholder.png"}
                  alt=""
                />

                <Link
                  to={`/c/${comm.name}`}
                  className={styles.textTruncate}
                  title={comm.name}
                >
                  {comm.name}
                </Link>

                <button
                  className={`${styles.button} ${styles.settings}`}
                  onClick={() => handleLeaveCommunity(comm.name)}
                >
                  Opuść <ArrowBackIcon className={styles.icon} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {showCreatedCommunities && (
          <ul className={styles.list}>
            {user.createdCommunities?.map((comm, index) => (
              <li className={styles.listElement} key={comm.id || index}>
                <img
                  className={styles.smallAvatar}
                  src={comm.avatar || "/img/pepe_placeholder.png"}
                  alt=""
                />
                <Link to={`/c/${comm.name}`} className={styles.text}>
                  {comm.name}
                </Link>
                <SettingsIcon className={styles.settings} />
              </li>
            ))}
          </ul>
        )}

        {showPosts && (
          <ul className={styles.list}>
            {user.posts?.map((post, index) => (
              <li className={styles.listElement} key={post.id || index}>
                <img
                  className={styles.smallAvatar}
                  src={post.communityAvatar || "/img/pepe_placeholder.png"}
                  alt=""
                />
                <Link
                  to={`/c/${post.communityName}`}
                  className={`${styles.textTruncate} ${styles.communityColumn}`}
                >
                  {post.communityName}
                </Link>
                <span className={styles.textTruncate} title={post.title}>
                  {post.title}
                </span>
                <span className={styles.date}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                <div className={styles.reactionsContainer}>
                  <div className={styles.reactions}>
                    <span>{post.comments}</span>
                    <CommentIcon fontSize="small" />
                  </div>
                  <div className={styles.reactions}>
                    <span>{post.upvotes}</span>
                    <ArrowUpwardIcon fontSize="small" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
