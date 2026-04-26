import styles from "./PostArea.module.css";
import pepe from "../../../public/img/pepe_placeholder.png";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Post } from "./posts/Post";
import { Sidebar } from "./sidebar/Sidebar";
import { useState, useEffect, useCallback } from "react";
import CreatePost from "./CreatePost/CreatePost";
import { Link, useParams, useNavigate } from "react-router"; // Dodany useNavigate
import { authEmitter } from "../services/authEmitter";

export interface Rule {
  rule_title: string;
  description: string;
}

export interface UserRole {
  role: "member" | "moderator" | "admin";
  can_delete_posts: boolean;
  can_ban_users: boolean;
  can_manage_mods: boolean;
}

export interface CommunityData {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
  rules: Rule[];
  tags: string[];
  currentUserRole: UserRole | null;
  isBanned?: boolean;
}

export function PostArea() {
  const { communityName } = useParams();
  const navigate = useNavigate();

  const [isMember, setIsMember] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [communityData, setCommunityData] = useState<CommunityData | null>(
    null,
  );
  const [posts, setPosts] = useState<any[]>([]);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const currentUser = authEmitter.getUser();
  const isOwner =
    currentUser && communityData && currentUser.id === communityData.owner_id;

  const toggleCreatePost = () => setIsCreatingPost(!isCreatingPost);

  const loadPosts = useCallback(
    async (cursor: string | null = null) => {
      if (isPostsLoading || (!hasMore && cursor !== null)) return;

      setIsPostsLoading(true);
      try {
        const token = localStorage.getItem("token");

        const url = `http://localhost:5000/api/communities/${communityName}?limit=10${
          cursor ? `&cursor=${cursor}` : ""
        }`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.isBanned) {
            setCommunityData((prev: any) => ({ ...prev, isBanned: true }));
            return;
          }
        }

        if (!response.ok) throw new Error("Błąd pobierania danych");

        const data = await response.json();

        if (cursor === null) {
          setCommunityData(data);
          setPosts(data.posts || []);
        } else {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsPostsLoading(false);
        setIsLoading(false);
      }
    },
    [communityName, hasMore, isPostsLoading],
  );

  const handleDeleteCommunity = async () => {
    if (
      !window.confirm(
        `CZY NA PEWNO CHCESZ TRWALE USUNĄĆ SPOŁECZNOŚĆ ${communityName}?`,
      )
    )
      return;

    const token = authEmitter.getToken();
    try {
      const res = await fetch(
        `http://localhost:5000/api/communities/${communityName}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        alert("Społeczność została usunięta.");
        navigate("/");
      } else {
        const data = await res.json();
        alert(data.error || "Błąd podczas usuwania");
      }
    } catch (err) {
      alert("Błąd serwera");
    }
  };

  const handleJoinCommunity = async () => {
    if (!communityName) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/joincommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: communityName }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        } else {
          throw new Error(`Błąd serwera (status ${response.status})`);
        }
      }

      const currentUser = authEmitter.getUser();

      if (currentUser) {
        const updatedCommunities = currentUser.communities
          ? [...currentUser.communities]
          : [];

        updatedCommunities.push({ name: communityName });

        const updatedUser = {
          ...currentUser,
          communities: updatedCommunities,
        };

        authEmitter.login(token, updatedUser);
      }

      setIsMember(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!communityName) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/leavecommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: communityName }),
      });

      const currentUser = authEmitter.getUser();

      if (currentUser && currentUser.communities) {
        const updatedCommunities = currentUser.communities.filter(
          (c: any) => c.name.toLowerCase() !== communityName.toLowerCase(),
        );

        const updatedUser = {
          ...currentUser,
          communities: updatedCommunities,
        };

        authEmitter.login(token, updatedUser);
      }

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        } else {
          throw new Error(`Błąd serwera (status ${response.status})`);
        }
      }

      setIsMember(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoggedIn(authEmitter.isAuthenticated());
    const updateAuth = () => setIsLoggedIn(authEmitter.isAuthenticated());
    authEmitter.subscribe("authChange", updateAuth);
    return () => authEmitter.unsubscribe("authChange", updateAuth);
  }, []);

  useEffect(() => {
    if (communityName) {
      setPosts([]);
      setNextCursor(null);
      setHasMore(true);
      loadPosts(null);
      setIsMember(authEmitter.isMemberOf(communityName));
    }
  }, [communityName]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 800 &&
        hasMore &&
        !isPostsLoading &&
        nextCursor
      ) {
        loadPosts(nextCursor);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextCursor, hasMore, isPostsLoading, loadPosts]);

  if (isLoading) return <div className={styles.pageWrapper}>Ładowanie...</div>;

  if (communityData?.isBanned) {
    return (
      <div className={styles.pageWrapper}>
        <div
          className={styles.centeredMessage}
          style={{ textAlign: "center", marginTop: "100px" }}
        >
          <DeleteForeverIcon sx={{ fontSize: 100, color: "#ff4444" }} />
          <h1 className={styles.errorTitle} style={{ color: "#ff4444" }}>
            ZOSTAŁEŚ ZBANOWANY
          </h1>
          <p className={styles.text}>
            Twoje konto zostało zablokowane w społeczności{" "}
            <strong>{communityName}</strong>. Nie masz dostępu do przeglądania
            postów ani ustawień.
          </p>
          <Link
            to="/"
            className={styles.submit}
            style={{
              marginTop: "20px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    );
  }

  if (error || !communityData) {
    return (
      <div className={styles.pageWrapper}>
        <h1>{error || "Nie znaleziono społeczności"}</h1>
        <Link to="/">Wróć na stronę główną</Link>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.postArea}>
        <div className={styles.community}>
          <div className={styles.communityHeader}>
            <img
              src={communityData.avatar_url || pepe}
              className={styles.communityLogo}
              alt="logo"
            />
            <h1 className={styles.text}>{communityData.name}</h1>

            {(isOwner || communityData.currentUserRole?.role === "admin") && (
              <Link to="/communities_settings">
                <button className={styles.settings}>
                  <SettingsIcon className={styles.icons} />
                </button>
              </Link>
            )}
          </div>

          {isLoggedIn && (isMember || isOwner) && (
            <button className={styles.button} onClick={toggleCreatePost}>
              Dodaj post <AddCircleOutlineIcon className={styles.icons} />
            </button>
          )}

          {isLoggedIn &&
            (isOwner ? (
              <button
                className={`${styles.button} ${styles.deleteBtn}`}
                onClick={handleDeleteCommunity}
                style={{ backgroundColor: "#ff4444", color: "white" }}
              >
                USUŃ SPOŁECZNOŚĆ <DeleteForeverIcon className={styles.icons} />
              </button>
            ) : isMember ? (
              <button className={styles.button} onClick={handleLeaveCommunity}>
                Opuść <LogoutIcon className={styles.icons} />
              </button>
            ) : (
              <button className={styles.button} onClick={handleJoinCommunity}>
                Dołącz <PersonAddIcon className={styles.icons} />
              </button>
            ))}
        </div>

        {isCreatingPost && <CreatePost />}

        <div className={styles.postsList}>
          {posts.map((post) => (
            <Post
              key={post.id}
              {...post}
              postId={post.id}
              communityId={communityData.id}
              rules={communityData.rules || []}
              tags={post.tags || []}
              createdAt={post.displayDate || post.createdAt}
            />
          ))}
          {isPostsLoading && (
            <p className={styles.loadingMore}>Ładowanie postów...</p>
          )}
          {!hasMore && posts.length > 0 && (
            <p className={styles.noMore}>To już wszystkie posty.</p>
          )}
        </div>
      </div>

      <Sidebar
        name={communityData.name}
        description={communityData.description}
        createdAt={communityData.created_at}
        rules={communityData.rules || []}
        tags={communityData.tags || []}
      />
    </div>
  );
}
