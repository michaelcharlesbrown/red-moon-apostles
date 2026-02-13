import Link from "next/link";
import styles from "./grain.module.css";

export default function GrainPage() {
  return (
    <main className={styles.page}>
      <Link href="/lab" className={styles.backLink}>
        ← Lab
      </Link>

      <h1 className={styles.title}>GRAIN</h1>
      <p className={styles.description}>
        A subtle film grain overlay for texture and depth.
      </p>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>Demo</span>
      </div>
    </main>
  );
}
