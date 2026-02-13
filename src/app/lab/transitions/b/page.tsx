import Link from "next/link";
import styles from "../transitions.module.css";

export default function PageB() {
  return (
    <main className={`${styles.page} ${styles.pageB}`}>
      <Link href="/lab/transitions" className={styles.backLink}>
        ← Transitions
      </Link>
      <h1 className={`${styles.bigTitle} ${styles.bigTitleB}`}>B</h1>
    </main>
  );
}
