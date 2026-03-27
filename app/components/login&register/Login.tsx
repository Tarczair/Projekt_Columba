import styles from "./Login.module.css";

export default function Login() {
  return (
    <form className={styles.formLogin}>
      <input
        className={styles.textInput}
        type="text"
        placeholder="E-mail/Nazwa"
      />
      <input className={styles.textInput} type="password" placeholder="Hasło" />
      <input className={styles.submit} type="submit" value="Zaloguj się" />
    </form>
  );
}
