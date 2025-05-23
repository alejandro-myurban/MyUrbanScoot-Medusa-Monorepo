"use client"
import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import ReactCountryFlag from "react-country-flag"

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const { i18n } = useTranslation()

  // Define available languages with associated country codes
  const languages = [
    { code: "en", label: "EN", country: "GB" },
    { code: "es", label: "ES", country: "ES" },
    { code: "it", label: "IT", country: "IT" }
  ]

  // Track current language and corresponding country code
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
    setCurrentLang(i18n.language)
    const langObj = languages.find(l => l.code === i18n.language)
    if (langObj) {
      setCurrentCountry(langObj.country)
    }
  }, [i18n.language])

  const toggle = () => setOpen(prev => !prev)
  const changeLang = (code: string) => {
    // Change i18n language and update state
    i18n.changeLanguage(code)
    setOpen(false)
    setCurrentLang(code)
    const langObj = languages.find(l => l.code === code)
    if (langObj) {
      setCurrentCountry(langObj.country)
    }
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="flex items-center gap-1 p-2 border rounded hover:bg-gray-100">
        {/* Show flag of current language */}
        <ReactCountryFlag
          svg
          style={{ width: '16px', height: '16px' }}
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
