import styles from "./PostArea.module.css";
import pepe from "../../../public/img/pepe_placeholder.png"; // Użyjemy tego jako fallbacku!
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Post } from "./posts/Post";
import { Sidebar } from "./sidebar/Sidebar";
import { useState, useEffect } from "react";
import CreatePost from "./CreatePost/CreatePost";
import { Link, useParams } from "react-router";
import { authEmitter } from "../services/authEmitter"; // IMPORT: do sprawdzania czy użytkownik jest zalogowany

interface Rule {
  rule_title: string;
  description: string;
}

interface CommunityData {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  created_at: string;
  rules: Rule[];
  tags: string[];
}

export function PostArea() {
  const { communityName } = useParams();

  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [communityData, setCommunityData] = useState<CommunityData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleCreatePost = () => {
    setIsCreatingPost(!isCreatingPost);
  };

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
    const fetchCommunity = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/communities/${communityName}`,
        );

        if (!response.ok) {
          throw new Error("Nie znaleziono społeczności (404)");
        }

        const data = await response.json();
        setCommunityData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (communityName) {
      fetchCommunity();
    }
  }, [communityName]);

  const posts = [
    {
      id: 1,
      avatarPath: "/img/pepe_placeholder.png",
      userName: "Użytkownik 1",
      title: "Przykładowy pierwszy post",
      text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
      tags: ["tag_1", "Tag_2"],
      image: "/img/golab.png",
      upvotes: 120,
      isRemoved: false,
      createdAt: "2h temu",
      comments: 4,
    },
  ];

  if (isLoading) {
    return <div className={styles.pageWrapper}>Ładowanie społeczności...</div>;
  }

  if (error || !communityData) {
    return (
      <div className={styles.pageWrapper}>
        <h1>{error || "Społeczność nie istnieje"}</h1>
        <Link to="/">Wróć na stronę główną</Link>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.postArea}>
        <div className={styles.community}>
          <div>
            <img
              src={communityData.avatar_url || pepe}
              className={styles.communityLogo}
              alt={`${communityData.name} logo`}
            />
            <h1 className={styles.text}>{communityData.name}</h1>

            <Link to="/communities_settings">
              <button className={styles.settings}>
                <SettingsIcon className={styles.icons} />
              </button>
            </Link>
          </div>

          <button className={styles.button} onClick={toggleCreatePost}>
            Dodaj post <AddCircleOutlineIcon className={styles.icons} />
          </button>

          {/*
              Używamy authEmitter.isAuthenticated() żeby sprawdzić czy użytkownik ma token
              Jeśli nie jest zalogowany - przycisk się nie wyświetla
          */}
          {isLoggedIn && (
            <button className={styles.button}>
              Dołącz <PersonAddIcon className={styles.icons} />
            </button>
          )}
        </div>

        {isCreatingPost && (
          <div className={styles.createPostForm}>
            <CreatePost />
          </div>
        )}

        {posts.map((post) => (
          <Post
            key={post.id}
            avatarPath={post.avatarPath}
            userName={post.userName}
            title={post.title}
            image={post.image}
            text={post.text}
            tags={post.tags}
            upvotes={post.upvotes}
            isRemoved={post.isRemoved}
            createdAt={post.createdAt}
            comments={post.comments}
          />
        ))}
      </div>
      <Sidebar
        name={communityData.name}
        description={communityData.description}
        createdAt={communityData.created_at}
        rules={communityData.rules}
        tags={communityData.tags}
      />
    </div>
  );
}
