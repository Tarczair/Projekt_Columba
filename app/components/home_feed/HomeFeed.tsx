import styles from "./HomeFeed.module.css";
import pepe from "../../../public/img/pepe_placeholder.png";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Post } from "../post_area/posts/Post";
import { Link } from "react-router";

export default function HomeFeed() {
  const feedData = [
    {
      communityName: "Programowanie",
      avatar: pepe,
      post: {
        id: 101,
        avatarPath: "/img/pepe_placeholder.png",
        userName: "DevKuba",
        title: "Jak nauczyć się Reacta?",
        text: "Krótki poradnik na start dla każdego, kto chce zacząć przygodę z frontendem...",
        tags: ["react", "nauka"],
        image: "",
        upvotes: 45,
        isRemoved: false,
        createdAt: "2h temu",
        comments: 12,
      },
    },
    {
      communityName: "GryWideo",
      avatar: pepe,
      post: {
        id: 102,
        avatarPath: "/img/pepe_placeholder.png",
        userName: "Gamer99",
        title: "Nowy zwiastun GTA VI",
        text: "Analiza klatka po klatce najnowszego trailera. Widzieliście te detale?!",
        tags: ["gta", "news"],
        image: "/img/golab.png",
        upvotes: 320,
        isRemoved: false,
        createdAt: "5h temu",
        comments: 89,
      },
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.postArea}>
        <h1 className={styles.mainTitle}>Odkrywaj Społeczności</h1>

        {feedData.map((item) => (
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
                <Link to={`/c/${item.communityName}/settings`}>
                  <SettingsIcon className={styles.settingsIcon} />
                </Link>
              </div>

              <div className={styles.headerRight}>
                <Link to={`/c/${item.communityName}`}>
                  <button className={styles.actionButton}>
                    Odwiedź <VisibilityIcon className={styles.buttonIcon} />
                  </button>
                </Link>
                <button
                  className={`${styles.actionButton} ${styles.joinButton}`}
                >
                  Dołącz <PersonAddIcon className={styles.buttonIcon} />
                </button>
              </div>
            </div>

            <Post {...item.post} />
          </div>
        ))}
      </div>
    </div>
  );
}
