import Login from "./Login";
import Register from "./Register";
import styles from "./Login.module.css";

export default function LoginSite() {
  return (
    <main className={styles.main}>
      <Register />
      <Login />
    </main>
  );
}
