import SearchIcon from "@mui/icons-material/Search";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.tradeMark}>© Columba</p>
      <p className={styles.footerButton}>Polityka prywatności</p>
      <p className={styles.footerButton}>Kontakt</p>
      <p className={styles.footerButton}>O nas</p>
    </footer>
  );
}
