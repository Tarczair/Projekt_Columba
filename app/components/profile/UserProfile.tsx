import styles from "./Profile.module.css";
import Search from "../search/Search";
import { useState, useEffect } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CommentIcon from "@mui/icons-material/Comment";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { authEmitter } from "../services/authEmitter";
import { Link, useParams, useNavigate } from "react-router";

interface PublicUserProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  created_at: string;
  friendshipStatus:
    | "none"
    | "friends"
    | "request_sent"
    | "request_received"
    | "self";
  communities: any[];
  posts: any[];
  createdCommunities: any[];
}

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCommunities, setShowCommunities] = useState(true);
  const [showCreatedCommunities, setShowCreatedCommunities] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProfile = async () => {
    const token = authEmitter.getToken();
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${username}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Błąd pobierania profilu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleFriendToggle = async () => {
    const token = authEmitter.getToken();
    if (!token) {
      alert("Musisz się zalogować, aby dodać znajomego.");
      return;
    }
    if (!user) return;

    const previousStatus = user.friendshipStatus;

    let nextStatus: "none" | "request_sent" | "friends" = "none";
    switch (previousStatus) {
      case "none":
        nextStatus = "request_sent";
        break;
      case "request_received":
        nextStatus = "friends";
        break;
      case "request_sent":
      case "friends":
        nextStatus = "none";
        break;
      default:
        nextStatus = "none";
    }

    setUser((prev) =>
      prev ? { ...prev, friendshipStatus: nextStatus } : null,
    );

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${username}/friend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.friendshipStatus) {
          setUser((prev) =>
            prev ? { ...prev, friendshipStatus: data.friendshipStatus } : null,
          );
        }
      } else {
        setUser((prev) =>
          prev ? { ...prev, friendshipStatus: previousStatus } : null,
        );
      }
    } catch (err) {
      console.error("Błąd zmiany statusu znajomego:", err);
      setUser((prev) =>
        prev ? { ...prev, friendshipStatus: previousStatus } : null,
      );
    }
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

  if (loading) return <div className={styles.site}>Ładowanie profilu...</div>;
  if (!user)
    return (
      <main className={styles.addCommunity}>
        <div className={styles.centeredMessage}>
          <h1 className={styles.errorTitle}>NIE ZNALEZIONO UŻYTKOWNIKA</h1>
        </div>
      </main>
    );

  const filteredCommunities = (user.communities || []).filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredCreatedCommunities = (user.createdCommunities || []).filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredPosts = (user.posts || []).filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.communityName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderFriendButton = () => {
    if (user.friendshipStatus === "self") return null;

    let icon,
      text,
      buttonClass = styles.submit;
    let secondaryButton = null;

    switch (user.friendshipStatus) {
      case "friends":
        icon = <PersonRemoveIcon />;
        text = "Usuń znajomego";
        break;
      case "request_sent":
        icon = <AccessTimeIcon />;
        text = "Anuluj zaproszenie";
        break;
      case "request_received":
        icon = <PersonAddIcon />;
        text = "Zaakceptuj zaproszenie";
        break;
      default:
        icon = <PersonAddIcon />;
        text = "Dodaj do znajomych";
    }

    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          className={buttonClass}
          onClick={handleFriendToggle}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          {icon} {text}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.site}>
      <div className={styles.userinfo}>
        <div className={styles.firstSection}>
          <img
            className={styles.avatar}
            src={user.avatar || "/img/pepe_placeholder.png"}
            alt="Avatar"
          />
          <h2 style={{ color: "white", margin: "10px 0" }}>{user.username}</h2>
          <div className={styles.name}>
            <p className={styles.date}>
              Dołączono: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className={styles.secondSection}>
          <div className={styles.inputs}>
            <p
              className={styles.inputDesc}
              style={{
                minHeight: "100px",
                backgroundColor: "#1a1a1b",
                padding: "15px",
                borderRadius: "4px",
                color: "lightgray",
              }}
            >
              {user.bio || "Ten użytkownik nie dodał jeszcze opisu."}
            </p>
          </div>

          {renderFriendButton()}
        </div>
      </div>

      <div className={styles.listComm}>
        <div className={styles.header}>
          <Search
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Filtruj zasoby..."
          />
          <div className={styles.options}>
            <button
              onClick={toggleCommunities}
              className={showCommunities ? styles.active : ""}
            >
              SPOŁECZNOŚCI ({user.communities?.length || 0})
            </button>
            <button
              onClick={togglePosts}
              className={showPosts ? styles.active : ""}
            >
              POSTY ({user.posts?.length || 0})
            </button>
            <button
              onClick={toggleCreatedCommunities}
              className={showCreatedCommunities ? styles.active : ""}
            >
              ZAŁOŻONE ({user.createdCommunities?.length || 0})
            </button>
          </div>
        </div>

        {showCommunities && (
          <ul className={styles.list}>
            {filteredCommunities.length === 0 && (
              <p style={{ color: "gray", padding: "15px" }}>
                Brak społeczności
              </p>
            )}
            {filteredCommunities.map((comm, index) => (
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
              </li>
            ))}
          </ul>
        )}

        {showCreatedCommunities && (
          <ul className={styles.list}>
            {filteredCreatedCommunities.length === 0 && (
              <p style={{ color: "gray", padding: "15px" }}>
                Brak założonych społeczności
              </p>
            )}
            {filteredCreatedCommunities.map((comm, index) => (
              <li className={styles.listElement} key={comm.id || index}>
                <img
                  className={styles.smallAvatar}
                  src={comm.avatar || "/img/pepe_placeholder.png"}
                  alt=""
                />
                <Link to={`/c/${comm.name}`} className={styles.text}>
                  {comm.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {showPosts && (
          <ul className={styles.list}>
            {filteredPosts.length === 0 && (
              <p style={{ color: "gray", padding: "15px" }}>Brak postów</p>
            )}
            {filteredPosts.map((post, index) => (
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
                <Link
                  to={`/c/${post.communityName}?highlight=${post.id}`}
                  className={styles.textTruncate}
                  title={post.title}
                  style={{ color: "white", textDecoration: "none" }}
                >
                  {post.title}
                </Link>
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
