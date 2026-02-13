import Link from "next/link";
import styles from "../transitions.module.css";

export default function PageA() {
  return (
    <main className={`${styles.page} ${styles.pageA}`}>
      <Link href="/lab/transitions" className={styles.backLink}>
        ← Transitions
      </Link>
      <h1 className={`${styles.bigTitle} ${styles.bigTitleA}`}>A</h1>
    </main>
  );
}
