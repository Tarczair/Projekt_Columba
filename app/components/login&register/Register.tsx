import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import styles from "./Login.module.css";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return alert("Hasła nie są identyczne!");
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Zarejestrowano pomyślnie! Możesz się zalogować.");
      } else {
        alert(data.error || "Błąd rejestracji");
      }
    } catch (err) {
      console.error("Błąd sieci:", err);
    }
  };

  return (
    <form className={styles.formRegister} onSubmit={handleSubmit}>
      <input
        className={styles.textInput}
        type="email"
        name="email"
        placeholder="E-mail"
        onChange={handleChange}
        required
      />
      <input
        className={styles.textInput}
        type="text"
        name="username"
        placeholder="Nazwa"
        onChange={handleChange}
        required
      />
      <input
        className={styles.textInput}
        type="password"
        name="password"
        placeholder="Hasło"
        onChange={handleChange}
        required
      />
      <input
        className={styles.textInput}
        type="password"
        name="confirmPassword"
        placeholder="Powtórz hasło"
        onChange={handleChange}
        required
      />
      <input className={styles.submit} type="submit" value="Zarejestruj się" />
    </form>
  );
}
