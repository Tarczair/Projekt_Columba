import styles from "./HomeFeed.module.css";
import pepe from "../../../public/img/pepe_placeholder.png";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Post } from "../post_area/posts/Post";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { authEmitter } from "../services/authEmitter";

export default function HomeFeed() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [feedData, setFeedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const updateAuth = () => {
      setIsLoggedIn(authEmitter.isAuthenticated());
    };

    updateAuth();
    authEmitter.subscribe("authChange", updateAuth);

    return () => {
      authEmitter.unsubscribe("authChange", updateAuth);
    };
  }, []);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/homefeed");
        const json = await res.json();
        setFeedData(json.data || []);
        setNextCursor(json.nextCursor);
      } catch (err) {
        console.error("Błąd pobierania HomeFeed", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const handleJoin = async (communityName: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/joincommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: communityName }),
      });

      if (res.ok) {
        const user = authEmitter.getUser();
        if (user) {
          user.communities = [
            ...(user.communities || []),
            { name: communityName },
          ];
          localStorage.setItem("user", JSON.stringify(user));
          setFeedData([...feedData]);
        }
      }
    } catch (err) {
      console.error("Błąd dołączania:", err);
    }
  };

  if (isLoading) return <div>Ładowanie społeczności...</div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.postArea}>
        <h1 className={styles.mainTitle}>Odkrywaj Społeczności</h1>

        {feedData?.map((item) => {
          const currentUser = authEmitter.getUser();

          const isOwner =
            currentUser?.id &&
            item.owner_id &&
            currentUser.id === item.owner_id;

          const isMember = currentUser?.communities?.some(
            (c: any) => c.name === item.communityName,
          );

          const canJoin = isLoggedIn && !isOwner && !isMember;

          return (
            <div key={item.post.id} className={styles.communitySection}>
              <div className={styles.communityHeader}>
                <div className={styles.headerLeft}>
                  <img
                    src={item.avatar}
                    className={styles.communityLogo}
                    alt="logo"
                  />
                  <Link
                    to={`/c/${item.communityName}`}
                    className={styles.communityName}
                  >
                    c/{item.communityName}
                  </Link>
                </div>

                <div className={styles.headerRight}>
                  {canJoin && (
                    <button
                      className={`${styles.button} ${styles.joinButton}`}
                      onClick={() => handleJoin(item.communityName)}
                    >
                      Dołącz <PersonAddIcon className={styles.buttonIcon} />
                    </button>
                  )}
                </div>
              </div>

              <Post
                {...item.post}
                postId={item.post.id}
                communityId={item.communityId}
                rules={item.communityRules || []}
                createdAt={new Date(item.post.createdAt).toLocaleDateString()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
