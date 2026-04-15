import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import styles from "./Login.module.css";
import { authEmitter } from "../services/authEmitter"; // Tu będzie obserwator do niego wysyłamy z poniższego kodu informację o zalogowaniu. dodatkowo tam mamy też funkcje związane z przechowywaniem tokenu.
import { useNavigate } from "react-router";

export default function Login() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Zamiast ręcznego zapisywania do localStorage + emitowania eventu, jak to miało miejsce wcześniej
        // używamy jednej metody która robi wszystko.
        authEmitter.login(data.token, data.user);
        navigate("/profile");
        //window.location.href = "/profile"; to nam ciągle czyści pamięć od nowa i przeglądarka traci dane i wywala dziwne błędy, 
        // tymczasem navigate działa lepiej bo zachowuje pamięć i działa zgodnie z zasadą SPA - Jedna strona na całą aplikację.
      } else {
        alert(data.error || "Błąd logowania");
      }
    } catch (err) {
      console.error("Błąd sieci:", err);
    }
  };

  return (
    <form className={styles.formLogin} onSubmit={handleSubmit}>
      <input
        className={styles.textInput}
        type="text"
        placeholder="E-mail/Nazwa"
        value={identity}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setIdentity(e.target.value)
        }
        required
      />
      <input
        className={styles.textInput}
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        required
      />
      <input className={styles.submit} type="submit" value="Zaloguj się" />
    </form>
  );
}
