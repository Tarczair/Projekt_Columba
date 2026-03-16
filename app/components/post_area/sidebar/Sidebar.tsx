import styles from "./Sidebar.module.css";
import { useState } from "react";
import avatarPath from "../../../../public/img/pepe_placeholder.png"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export function Sidebar({ /*communityName, description, rules, tags, isRemoved, createdAt*/ }) {
    const userName = "Przykładowy społeczność";
    const createdAt = "12.01.2025";
    const comments = 46;

    const [isRules, setIsRules] = useState(false);
    const toogleRules = () => setIsRules(!isRules);

    const [isCommunities, setIsCommunities] = useState(false);
    const toogleCommunities = () => setIsCommunities(!isCommunities);

    const [isContact, setIsContact] = useState(false);
    const toogleContact = () => setIsContact(!isContact);

    const tags = ["Tag_1", "Tag_2", "Tag_3"];
    const rules = ["nie wiem idk", "nie wiem idk tylko dłuższe", "nie wiem idk tylko dłuższe", "dobra moze starczy dla testow"];
    const communities = ["Społeczność 1", "Społeczność 2", "Społeczność 3", "Społeczność 4", "Społeczność 5", "Społeczność 6"];
    const contacts = ["Użytkownik 1", "Użytkownik 2", "Użytkownik 3","Użytkownik 4", "Użytkownik 5","Użytkownik 6"]

    return(
        <div className={styles.sidebar}>
           <div className={styles.newSection}>
                <h2 className={styles.text}>{userName}</h2>
                <p className={styles.text}>Utworzona: {createdAt}</p>
           </div>
           <div className={styles.newSection}>
                <h3 className={styles.text}>Opis społeczności</h3>
                <p className={styles.text}>Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptates amet corrupti optio sint tempora reprehenderit labore sit doloremque, ipsam, minus eveniet quod debitis dolores illum ipsum omnis unde aspernatur dolorem!</p>
           </div>
           <div className={styles.newSection}>
                <p className={styles.text}>TAGI:</p>
                <ul className={styles.list}>
                    {tags.map((tag, index) => (
                        <li key={index}>#{tag}</li>
                    ))}
                </ul>
           </div>
           <div className={styles.newSection}>
                <button className={styles.button} onClick={toogleRules}>REGULAMIN {isRules ? <ExpandLessIcon className={styles.icon} /> : <ExpandMoreIcon className={styles.icon} />}</button>
                {isRules && (
                    <ul className={styles.list}>
                        {rules.map((rule, index) => (
                            <li key={index}>Zasada nr {index + 1}: {rule}</li>
                        ))}
                    </ul>
                )}
           </div>
           <div className={styles.newSection}>
                <h3 className={styles.text}>TWOJE SPOŁECZNOŚCI</h3>
                <ul className={styles.list}>
                    {communities.slice(0, isCommunities ? communities.length : 3).map((community, index) => (
                        <li key={index}><img className={styles.avatar} src={avatarPath} alt="avatar" /> {community}</li>
                    ))}
                </ul>
                <button className={styles.button} onClick={toogleCommunities}>Wiecej społeczności {isCommunities ? <ExpandLessIcon className={styles.icon} /> : <ExpandMoreIcon className={styles.icon} />}</button>
           </div>
           <div className={styles.newSection}>
                <h3 className={styles.text}>TWOJE KONTAKY</h3>
                <ul className={styles.list}>
                    {contacts.slice(0, isContact ? contacts.length : 3).map((contact, index) => (
                        <li key={index}><img className={styles.avatar} src={avatarPath} alt="avatar" /> {contact}</li>
                    ))}
                </ul>
                <button className={styles.button} onClick={toogleContact}>Wiecej kontaktów {isContact ? <ExpandLessIcon className={styles.icon} /> : <ExpandMoreIcon className={styles.icon} />}</button>
           </div>

        </div>
    );
}