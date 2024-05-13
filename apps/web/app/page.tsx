import styles from "./page.module.css";
import { Button } from "@repo/ui";
export default function Home() {
  return (
    <main className={styles.main}>
      <Button.Button />
    </main>
  );
}
