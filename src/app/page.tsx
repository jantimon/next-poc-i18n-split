import styles from "./page.module.css";
import { ClientDemo } from "./client";

import { useTranslations } from "../../useTranslation";

export default function Home() {
  const t = useTranslations();
  return (
    <main className={styles.main}>
      <ClientDemo />
        {t("page.tsx")}
      <div>

        {t("Hello", {
          name: "Moon",
          count: 0
        })}

        <br />

        {t("Hello", {
          name: <img src="https://i.giphy.com/media/wa8uMtV7bmdGTGGmD7/giphy.webp" width={`30px`} />,
          count: 1,
          b: (children: React.ReactNode) => <span style={{ fontSize: "200%", color: "purple" }}>{children}</span>,
        })}
      </div>
    </main>
  );
}
