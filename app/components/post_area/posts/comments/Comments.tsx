import styles from "./Comments.module.css";
import Comment from "./Comment";
import { useState, useEffect } from "react";
import { authEmitter } from "../../../services/authEmitter"; // IMPORT: do sprawdzania czy użytkownik jest zalogowany

export default function Comments() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  return (
    <div className={styles.commentContainer}>
      {/*
          Używamy authEmitter.isAuthenticated() żeby sprawdzić czy użytkownik ma token
          Jeśli nie jest zalogowany - cała sekcja dodawania komentarzy się nie wyświetla
      */}
      {isLoggedIn && (
        <div className={styles.addComment}>
          <textarea
            className={styles.commentInput}
            placeholder="Napisz komentarz..."
            rows={2}
          />
          <button className={styles.submitButton}>Dodaj komentarz</button>
        </div>
      )}

      {/* Przykładowe pokazowe dane przed załączneiem bazy danych*/}
      <div className={styles.commentsList}>
        <Comment
          author="Jakub Jarota"
          time="2023-10-10 14:30"
          content="Taki se ten post."
          upvotes={10}
          repliesCount={2}
          avatarPath="/img/pepe_placeholder.png"
        />

        <Comment
          author="Użytkownik Elektrody"
          time="2023-10-10 15:45"
          content="Było wałkowane tysiąc razy użyj opcji 'szukam'. To nie strona dla laików tylko poważnych koneserów sztuki elektronicznej i prawdziwych wyjadaczy! Temat banalny, zaśmiecający stronę poza tym zasilacz z czarnej listy. A pamiętacie swoją drogą to wydarzenie w 98 na Warszawskim ursynowie jak był festiwal lutowniczy? Ahhh do dziś pamiętam ten zapach cyny i dymu z palonych elementów. To były czasy! Trochę off topic, tak czy inaczej nie pozdrawiam a temat zamykam."
          upvotes={5}
          repliesCount={0}
          avatarPath="/img/pepe_placeholder.png"
        />

        <Comment
          author="Jan Wójcik"
          time="2024-03-18 10:00"
          content="A mi tam się post podoba widać napracowanie!"
          upvotes={15}
          repliesCount={1}
          avatarPath="/img/pepe_placeholder.png"
        >
          <Comment
            author="Michał Wilk"
            time="2024-03-18 10:30"
            content="Nie no bratku totalnie -1 i nie rel."
            upvotes={-8}
            repliesCount={0}
            avatarPath="/img/pepe_placeholder.png"
          />
        </Comment>
      </div>
    </div>
  );
}
