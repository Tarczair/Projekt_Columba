import styles from "./Profile.module.css"
import Search from "../search/search";
import { useState } from "react";

    const USER_DATA = {
        id: 3,
        username: "Użytkownik 2",
        email: "user@columba.pl",
        avatar: "/img/pepe_placeholder.png",
        bio: "soluta a rem assumenda quam architecto provident possimus earum est temporibus quod voluptatum quibusdam dolorem.",
        joinedDate: "21 Marca 2024",
    };

    const COMMUNITIES = [ {
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
    }
    ,{
        id: 4,
        name: "Społeczność 4",
        avatar: "/img/pepe_placeholder.png",
    }]

    const CREATED_COMMUNITIES = [ {
        id: 5,
        name: "Społeczność 5",
        avatar: "/img/pepe_placeholder.png",
    },
    {
        id: 6,
        name: "Społeczność 6",
        avatar: "/img/pepe_placeholder.png",
    },]

    const POSTS = [         
        {
            id: 2,
            avatarPath: "/img/pepe_placeholder.png",
            userName: "Użytkownik 2",
            title: "Drugi post",
            upvotes: 45,
            isRemoved: false,
            createdAt: "5h temu",
            comments: 4,
            communityName: "Społeczność 1",
        },
    ]

    const [showCommunities, setShowCommunities] = useState(true); 
    const [showCreatedCommunities, setShowCreatedCommunities] = useState(false); 
    const [showPosts, setShowPosts] = useState(false); 

    const toggleCommunities = () => {
        setShowCommunities(!showCommunities); 
    }

    const toggleCreatedCommunities = () => {
        setShowCreatedCommunities(!showCreatedCommunities); 
    }

    const togglePosts = () => {
        setShowPosts(!showPosts); 
    }

    export default function Profile() {
        return(
            <div>
                <form>
                    <div>
                        <img src={USER_DATA.avatar} alt="" />
                        <input type="text" value={USER_DATA.username}/>
                        <div>
                            <p>{USER_DATA.username.length}/300</p>
                            <p>Dołączono: {USER_DATA.joinedDate}</p>
                        </div>
                    </div>
                    <div>
                        <input type="text" value={USER_DATA.bio} />
                        <input type="text" value={USER_DATA.email} />
                        <input type="submit" value="Zatwierdź zmiany" />
                    </div>
                </form>
                <div>
                    <Search/>
                    <div>
                        <button onClick={toggleCommunities}>TWOJE SPOŁECZNOŚCI</button>
                        <button onClick={togglePosts}>TWOJE POSTY</button>
                        <button onClick={toggleCreatedCommunities}>ZAŁOŻONE SPOŁECZNOŚCI</button>
                    </div>
                    {showCommunities &&                      
                        <ul>
                            <li></li>
                        </ul>
                    }

                </div>
            </div>
        );
    }
