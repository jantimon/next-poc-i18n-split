"use client";
import { useTranslations } from "../../../useTranslation";

export const ClientDemo2 = () => {
  const t = useTranslations();
  return <p>{t("client2.tsx")}</p>;
};
