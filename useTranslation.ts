export const useTranslations = () => { return (t: string) => `t:${t}`;}
export const x = () => { return useTranslations(); }