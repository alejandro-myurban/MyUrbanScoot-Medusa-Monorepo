"use client"

import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useRouter, usePathname } from "next/navigation"
import ReactCountryFlag from "react-country-flag"

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const { i18n } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const languages = [
    { code: "en", label: "EN", country: "GB" },
    { code: "es", label: "ES", country: "ES" },
    { code: "it", label: "IT", country: "IT" },
    { code: "de", label: "DE", country: "DE" },
    { code: "pt", label: "PT", country: "PT" },
    { code: "fr", label: "FR", country: "FR" },
    { code: "nl", label: "NL", country: "NL" }
  ]

  const [currentLang, setCurrentLang] = useState(() => {
    // Usar el idioma actual de i18n que viene de la cookie
    return i18n.language.substring(0, 2) // Tomamos solo los primeros 2 caracteres por si viene 'es-ES'
  })
  
  const [currentCountry, setCurrentCountry] = useState(() => {
    const langCode = i18n.language.substring(0, 2)
    return languages.find(l => l.code === langCode)?.country || "GB"
  })

  useEffect(() => {
    // On mount or if user changes language elsewhere, sync state
    const langCode = i18n.language.substring(0, 2)
    setCurrentLang(langCode)
    const langObj = languages.find(l => l.code === langCode)
    if (langObj) {
      setCurrentCountry(langObj.country)
    }
  }, [i18n.language])

  const toggle = () => setOpen(prev => !prev)
  
  const changeLang = (code: string) => {
    // Find the selected language object
    const langObj = languages.find(l => l.code === code)
    if (!langObj) return

    // Change i18n language
    i18n.changeLanguage(code)
    setOpen(false)
    setCurrentLang(code)
    setCurrentCountry(langObj.country)

    // Extract current country code from pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    const currentCountryCode = pathSegments[0] // Primer segmento es el countryCode
    
    // Build new pathname with new country code
    const newCountryCode = langObj.country.toLowerCase() // Convert to lowercase for URL
    const newPathSegments = [newCountryCode, ...pathSegments.slice(1)]
    const newPathname = '/' + newPathSegments.join('/')
    
    // Navigate to new URL
    router.push(newPathname)
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="flex items-center gap-1 p-2 rounded active:none ">
        {/* Show flag of current language */}
        <ReactCountryFlag
          svg
          className="hover:scale-110 transition-transform"
          style={{ width: '24px', height: '24px' }}
          countryCode={currentCountry}
          aria-label={currentLang}
        />
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-50">
          {languages.map(lang => (
            <li key={lang.code}>
              <button
                onClick={() => changeLang(lang.code)}
                className="flex items-center gap-2 w-full text-left px-3 py-1 hover:bg-gray-200"
              >
                <ReactCountryFlag
                  svg
                  style={{ width: '16px', height: '16px' }}
                  countryCode={lang.country}
                  aria-label={lang.label}
                />
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}