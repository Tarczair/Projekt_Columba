import styles from "./Login.module.css";

export default function Register() {
  return (
    <form className={styles.formRegister}>
      <input className={styles.textInput} type="text" placeholder="E-mail" />
      <input className={styles.textInput} type="text" placeholder="Nazwa" />
      <input className={styles.textInput} type="password" placeholder="Hasło" />
      <input
        className={styles.textInput}
        type="password"
        placeholder="Powtórz hasło"
      />
      <input className={styles.submit} type="submit" value="Zarejestruj się" />
    </form>
  );
}
