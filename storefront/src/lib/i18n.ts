// src/lib/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Sólo cargamos los plugins React, pero NO init()
// No importamos JSON aquí, ni detectores ni backend.
i18n.use(initReactI18next)

export default i18n
