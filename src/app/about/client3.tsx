"use client";

import { useTranslations } from "../../../useTranslation";
import { Hybrid } from "./hybrid";

export const ClientDemo3 = () => {
    const t = useTranslations();
    return <>
        <Hybrid />
        <p>
            {t("client3.tsx")}
        </p>
    </>
}