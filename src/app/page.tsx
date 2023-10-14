import styles from './page.module.css'
import { ClientDemo } from './client'


import { useTranslations } from "../../useTranslation";

export default function Home() {
  const t = useTranslations()
  return (
    <main className={styles.main}>
     <ClientDemo />
     {t("page.tsx")}
    </main>
  )
}
