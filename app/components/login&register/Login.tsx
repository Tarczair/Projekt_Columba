import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import styles from "./Login.module.css";

export default function Login() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");

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
        // Zapisujemy token JWT w przeglądarce
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/profile";
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
