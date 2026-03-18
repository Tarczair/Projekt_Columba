import styles from "./PostArea.module.css";
import pepe from "../../../public/img/pepe_placeholder.png"
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Post } from "./posts/Post";
import { Sidebar } from "./sidebar/Sidebar";
import { useState } from "react";
import CreatePost from "./CreatePost/CreatePost";

export function PostArea() {

    const [isCreatingPost, setIsCreatingPost] = useState(false); 
    const toggleCreatePost = () => {
        setIsCreatingPost(!isCreatingPost); 
    }

    const posts = [
        {
            id: 1,
            avatarPath: "/img/pepe_placeholder.png",
            userName: "Użytkownik 1",
            title: "Przykładowy pierwszy post",
            text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Officiis quaerat officia quia debitis modi, ratione, rem asperiores mollitia ab nostrum beatae. Iste sint, ab, vero, soluta a rem assumenda quam architecto provident possimus earum est temporibus quod voluptatum quibusdam dolorem.",
            tags: ["tag_1", "Tag_2"],
            image: "/img/golab.png",
            upvotes: 120,
            isRemoved: false,
            createdAt: "2h temu",
            comments: 4
        },
        {
            id: 2,
            avatarPath: "/img/pepe_placeholder.png",
            userName: "Użytkownik 2",
            title: "Drugi post",
            text: "soluta a rem assumenda quam architecto provident possimus earum est temporibus quod voluptatum quibusdam dolorem.",
            tags: ["tag_1", "Tag_2"],
            image: "",
            upvotes: 45,
            isRemoved: false,
            createdAt: "5h temu",
            comments: 4
        },
        {
            id: 3,
            avatarPath: "/img/pepe_placeholder.png",
            userName: "Użytkownik 2",
            title: "Drugi post",
            text: "soluta a rem assumenda quam architecto provident possimus earum est temporibus quod voluptatum quibusdam dolorem.",
            tags: ["tag_1", "Tag_2"],
            image: "",
            upvotes: 45,
            isRemoved: true,
            createdAt: "5h temu",
            comments: 4
        }
    ];

    const communityName = "Przykładowa społeczność";

    return(
        <div className={styles.pageWrapper}>
            <div className={styles.postArea}>
                <div className={styles.community}>
                    <div>
                        <img src={pepe} className={styles.communityLogo} alt="community logo" />
                        <h1 className={styles.text}>{communityName}</h1>
                        <button className={styles.settings}><SettingsIcon className={styles.icons}/></button>
                    </div>
                    
                    <button className={styles.button} onClick={toggleCreatePost}>
                        Dodaj post <AddCircleOutlineIcon className={styles.icons}/>
                    </button>
                    

                    <button className={styles.button}>Dołącz <PersonAddIcon className={styles.icons}/></button>
                </div>

                {isCreatingPost && <div className={styles.createPostForm}>
                    <CreatePost />
                </div>}
                {posts.map(post => (
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
            <Sidebar></Sidebar>
        </div>
    );
}