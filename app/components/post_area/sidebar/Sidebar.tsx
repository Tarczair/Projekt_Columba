import styles from "./Sidebar.module.css";
import { useState } from "react";
import avatarPath from "../../../../public/img/pepe_placeholder.png";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface Rule {
  rule_title: string;
  description: string;
}

interface SidebarProps {
  name?: string;
  description?: string;
  createdAt?: string;
  rules?: Rule[];
  tags?: string[];
}

export function Sidebar({
  name = "Nazwa społeczności",
  description = "Brak opisu.",
  createdAt,
  rules = [],
  tags = [],
}: SidebarProps) {
  const [isRules, setIsRules] = useState(false);
  const toogleRules = () => setIsRules(!isRules);

  const [isCommunities, setIsCommunities] = useState(false);
  const toogleCommunities = () => setIsCommunities(!isCommunities);

  const [isContact, setIsContact] = useState(false);
  const toogleContact = () => setIsContact(!isContact);

  const dateDisplay = createdAt
    ? new Date(createdAt).toLocaleDateString("pl-PL")
    : "Nieznana";

  const communities = [
    "Społeczność 1",
    "Społeczność 2",
    "Społeczność 3",
    "Społeczność 4",
    "Społeczność 5",
    "Społeczność 6",
  ];

  const contacts = [
    "Użytkownik 1",
    "Użytkownik 2",
    "Użytkownik 3",
    "Użytkownik 4",
    "Użytkownik 5",
    "Użytkownik 6",
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.newSection}>
        <h2 className={styles.text}>{name}</h2>
        <p className={styles.text}>Utworzona: {dateDisplay}</p>
      </div>

      <div className={styles.newSection}>
        <h3 className={styles.text}>Opis społeczności</h3>
        <p className={styles.text}>{description}</p>
      </div>

      {tags.length > 0 && (
        <div className={styles.newSection}>
          <p className={styles.text}>TAGI:</p>
          <ul className={styles.list}>
            {tags.map((tag, index) => (
              <li key={index}>#{tag}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.newSection}>
        <button className={styles.button} onClick={toogleRules}>
          REGULAMIN{" "}
          {isRules ? (
            <ExpandLessIcon className={styles.icon} />
          ) : (
            <ExpandMoreIcon className={styles.icon} />
          )}
        </button>
        {isRules && (
          <ul className={styles.list}>
            {rules.length > 0 ? (
              rules.map((rule, index) => (
                <li key={index} className={styles.ruleItem}>
                  <strong>{rule.rule_title}</strong>: {rule.description}
                </li>
              ))
            ) : (
              <li className={styles.text}>Brak zdefiniowanych zasad.</li>
            )}
          </ul>
        )}
      </div>

      <div className={styles.newSection}>
        <h3 className={styles.text}>TWOJE SPOŁECZNOŚCI</h3>
        <ul className={styles.list}>
          {communities
            .slice(0, isCommunities ? communities.length : 3)
            .map((community, index) => (
              <li key={index}>
                <img className={styles.avatar} src={avatarPath} alt="avatar" />{" "}
                {community}
              </li>
            ))}
        </ul>
        <button className={styles.button} onClick={toogleCommunities}>
          {isCommunities ? "Mniej" : "Więcej"} społeczności{" "}
          {isCommunities ? (
            <ExpandLessIcon className={styles.icon} />
          ) : (
            <ExpandMoreIcon className={styles.icon} />
          )}
        </button>
      </div>

      <div className={styles.newSection}>
        <h3 className={styles.text}>TWOJE KONTAKTY</h3>
        <ul className={styles.list}>
          {contacts
            .slice(0, isContact ? contacts.length : 3)
            .map((contact, index) => (
              <li key={index}>
                <img className={styles.avatar} src={avatarPath} alt="avatar" />{" "}
                {contact}
              </li>
            ))}
        </ul>
        <button className={styles.button} onClick={toogleContact}>
          {isContact ? "Mniej" : "Więcej"} kontaktów{" "}
          {isContact ? (
            <ExpandLessIcon className={styles.icon} />
          ) : (
            <ExpandMoreIcon className={styles.icon} />
          )}
        </button>
      </div>
    </div>
  );
}
