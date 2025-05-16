'use client'

import React, { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../lib/i18n'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Cargamos dinámicamente sólo en navegador los backends y las traducciones
    Promise.all([
      import('i18next-http-backend').then(m => i18n.use(m.default)),
      import('i18next-browser-languagedetector').then(m => i18n.use(m.default)),
    ]).then(async () => {
      // Ahora inicializamos con los JSON del public/locales
      await i18n.init({
        fallbackLng: 'es',
        ns: ['common'],
        defaultNS: 'common',
        backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
        interpolation: { escapeValue: false },
        react: { useSuspense: false },
      })
      setReady(true)
    })
  }, [])

  if (!ready) return null // o un spinner
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
