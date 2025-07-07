// src/i18n/config.ts
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import itCommon from "../../public/locales/it/common.json"
import esCommon from "../../public/locales/es/common.json"
import enCommon from "../../public/locales/en/common.json"
import deCommon from "../../public/locales/de/common.json"
import ptCommon from "../../public/locales/pt/common.json"

i18n
  
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === "development",
    ns: ["common"],
    defaultNS: "common",

    resources: {
      it: {
        common: itCommon, // Archivo JSON para italiano
      },
      es: {
        common: esCommon, // Archivo JSON para español
      },
      en: {
        common: enCommon, // Archivo JSON para inglés
      },
      de: {
        common: deCommon, // Archivo JSON para alemán 
      },
      pt:  {
        common: ptCommon, // Archivo JSON para portugués
      }
    },

    detection: {
      // Primero lee el código de idioma de la ruta (/it/…)
      order: ["path", "cookie", "localStorage", "navigator"],
      // Usamos el primer segmento de la URL: '/it/...' → 'it'
      lookupFromPathIndex: 0,

      // Además persistimos en cookie para visitas posteriores
      caches: ["cookie"],
      lookupCookie: "i18next",
      cookieOptions: {
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        path: "/",
      },
    },

    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

export default i18n
