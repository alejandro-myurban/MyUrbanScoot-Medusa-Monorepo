// src/lib/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEN from '../../locales/en/common.json'
import commonES from '../../locales/es/common.json'
import commonIT from '../../locales/it/common.json'

// Inicializamos **solo** con initReactI18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: commonEN },
      es: { common: commonES },
      it: { common: commonIT },
    },
    lng: 'es',            // o recupera de localStorage en cliente
    fallbackLng: 'es',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }, // deshabilita suspense si no lo usas
  })

export default i18n
