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
      const token = localStorage.getItem("token");
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
      <div className={styles.site}>
        Musisz się zalogować, aby zobaczyć profil.
      </div>
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
                <span className={styles.text}>{comm.name}</span>
                <button className={styles.button}>
                  Opuść społeczność <ArrowBackIcon className={styles.icon} />
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
                <span className={styles.text}>{comm.name}</span>
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
                <span className={styles.text}>{post.communityName}</span>
                <span className={styles.text}>{post.title}</span>
                <span className={styles.text}>{post.createdAt}</span>
                <div className={styles.reactions}>
                  <span className={styles.iconText}>{post.comments}</span>
                  <CommentIcon className={styles.icon} />
                </div>
                <div className={styles.reactions}>
                  <span className={styles.iconText}>{post.upvotes}</span>
                  <ArrowUpwardIcon className={styles.icon} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
