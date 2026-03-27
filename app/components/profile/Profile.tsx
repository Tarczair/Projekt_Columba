import styles from "./Profile.module.css";
import Search from "../search/Search";
import { useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CommentIcon from "@mui/icons-material/Comment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const USER_DATA = {
  id: 3,
  username: "Użytkownik 2",
  email: "user@columba.pl",
  avatar: "/img/pepe_placeholder.png",
  bio: "soluta a rem assumenda quam architecto provident possimus earum est temporibus quod voluptatum quibusdam dolorem.",
  joinedDate: "21 Marca 2024",
};

const COMMUNITIES = [
  {
    id: 1,
    name: "Społeczność 1",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 2,
    name: "Społeczność 2",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 3,
    name: "Społeczność 3",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 4,
    name: "Społeczność 4",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 4,
    name: "Społeczność 4",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 4,
    name: "Społeczność 4",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 4,
    name: "Społeczność 4",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 4,
    name: "Społeczność 4",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 4,
    name: "Społeczność 4",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 4,
    name: "Społeczność 4",
    avatar: "/img/pepe_placeholder.png",
  },
];

const CREATED_COMMUNITIES = [
  {
    id: 5,
    name: "Społeczność 5",
    avatar: "/img/pepe_placeholder.png",
  },
  {
    id: 6,
    name: "Społeczność 6",
    avatar: "/img/pepe_placeholder.png",
  },
];

const POSTS = [
  {
    id: 2,
    title: "Drugi post",
    upvotes: 45,
    isRemoved: false,
    createdAt: "5h temu",
    comments: 4,
    communityName: "Społeczność 1",
    communityAvatar: "/img/pepe_placeholder.png",
  },
  {
    id: 3,
    title: "Drugi post",
    upvotes: 45,
    isRemoved: false,
    createdAt: "5h temu",
    comments: 4,
    communityName: "Społeczność 1",
    communityAvatar: "/img/pepe_placeholder.png",
  },
];

export default function Profile() {
  const [showCommunities, setShowCommunities] = useState(true);
  const [showCreatedCommunities, setShowCreatedCommunities] = useState(false);
  const [showPosts, setShowPosts] = useState(false);

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

  return (
    <div className={styles.site}>
      <form className={styles.userinfo}>
        <div className={styles.firstSection}>
          <img className={styles.avatar} src={USER_DATA.avatar} alt="" />
          <input
            className={styles.input}
            type="text"
            value={USER_DATA.username}
          />
          <div className={styles.name}>
            <p className={styles.text}>{USER_DATA.username.length}/300</p>
            <p className={styles.date}>Dołączono: {USER_DATA.joinedDate}</p>
          </div>
        </div>
        <div className={styles.secondSection}>
          <textarea className={styles.inputDesc} value={USER_DATA.bio} />
          <p className={styles.text}>{USER_DATA.email}</p>
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
            <button onClick={toggleCommunities}>TWOJE SPOŁECZNOŚCI</button>
            <button onClick={togglePosts}>TWOJE POSTY</button>
            <button onClick={toggleCreatedCommunities}>
              ZAŁOŻONE SPOŁECZNOŚCI
            </button>
          </div>
        </div>
        {showCommunities && (
          <ul className={styles.list}>
            {COMMUNITIES.map((comm, index) => (
              <li className={styles.listElement} key={index}>
                <img className={styles.smallAvatar} src={comm.avatar} alt="" />
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
            {CREATED_COMMUNITIES.map((comm, index) => (
              <li className={styles.listElement} key={index}>
                <img className={styles.smallAvatar} src={comm.avatar} alt="" />
                <span className={styles.text}>{comm.name}</span>
                <SettingsIcon className={styles.settings} />
              </li>
            ))}
          </ul>
        )}
        {showPosts && (
          <ul className={styles.list}>
            {POSTS.map((post, index) => (
              <li className={styles.listElement} key={index}>
                <img
                  className={styles.smallAvatar}
                  src={post.communityAvatar}
                  alt=""
                />
                <span className={styles.text}>{post.communityName}</span>
                <span className={styles.text}>{post.title}</span>
                <span className={styles.text}>{post.createdAt}</span>
                <div className={styles.reactions}>
                  {" "}
                  <span className={styles.iconText}>{post.comments}</span>{" "}
                  <ArrowUpwardIcon className={styles.icon} />
                </div>
                <div className={styles.reactions}>
                  {" "}
                  <span className={styles.iconText}>{post.upvotes}</span>{" "}
                  <CommentIcon className={styles.icon} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
