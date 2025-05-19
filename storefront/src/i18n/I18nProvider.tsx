// src/i18n/I18nProvider.tsx
"use client";

import { useEffect, ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18next from 'i18next'
import i18n from './config'

type I18nProviderProps = {
  children: ReactNode
  countryCode: string
}

export default function I18nProvider({ children, countryCode }: I18nProviderProps) {
  // Mapeo de códigos de país a idiomas
  const countryToLanguageMap: Record<string, string> = {
    us: 'en',
    gb: 'en',
    ca: 'en',
    au: 'en',
    es: 'es',
    mx: 'es',
    co: 'es',
    ar: 'es',
    fr: 'fr',
    be: 'fr',
    it: 'it',
    // Añadir más mapeos según sea necesario
  }
  
  const language = countryToLanguageMap[countryCode.toLowerCase()] || countryCode || 'en'

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}