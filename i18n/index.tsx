import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationsInEn from "../locales/en/translation.json";
import translationsInRu from "../locales/ru/translation.json";

const resources = {
    en: {
        translation: translationsInEn,
    },
    ru: {
        translation: translationsInRu,
    },
};

i18n
	.use(initReactI18next)
	.init({
		resources,
		lng: "en",
		interpolation: {
			escapeValue: false
		}
});

export default i18n;
