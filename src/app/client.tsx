"use client";
import { useTranslations } from "../../useTranslation";

export const ClientDemo = () => {
    const t = useTranslations();
    return <p>
            {t("client.tsx")}
        </p>
}