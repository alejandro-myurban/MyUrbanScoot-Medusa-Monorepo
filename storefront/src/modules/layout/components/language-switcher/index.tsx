"use client"

import React, { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useRouter, usePathname } from "next/navigation"
import ReactCountryFlag from "react-country-flag"
import { Globe } from "lucide-react"

export default function LanguageSwitcher({ color }: { color?: string }) {
  const [open, setOpen] = useState(false)
  const { i18n } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const languages = [
    { code: "en", label: "English", country: "GB" },
    { code: "es", label: "Español", country: "ES" },
    { code: "it", label: "Italiano", country: "IT" },
    { code: "de", label: "Deutsch", country: "DE" },
    { code: "pt", label: "Português", country: "PT" },
    { code: "fr", label: "Français", country: "FR" },
    { code: "nl", label: "Nederlands", country: "NL" },
  ]

  const [currentLang, setCurrentLang] = useState(() => {
    return i18n.language.substring(0, 2)
  })

  const [currentCountry, setCurrentCountry] = useState(() => {
    const langCode = i18n.language.substring(0, 2)
    return languages.find((l) => l.code === langCode)?.country || "GB"
  })

  useEffect(() => {
    const langCode = i18n.language.substring(0, 2)
    setCurrentLang(langCode)
    const langObj = languages.find((l) => l.code === langCode)
    if (langObj) {
      setCurrentCountry(langObj.country)
    }
  }, [i18n.language])

  // ✅ Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // ✅ Función para abrir con hover
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setOpen(true)
  }

  // ✅ Función para cerrar con delay
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 200) // 200ms de delay para evitar que se cierre muy rápido
  }

  const changeLang = (code: string) => {
    const langObj = languages.find((l) => l.code === code)
    if (!langObj) return

    i18n.changeLanguage(code)
    setOpen(false)
    setCurrentLang(code)
    setCurrentCountry(langObj.country)

    const pathSegments = pathname.split("/").filter(Boolean)
    const currentCountryCode = pathSegments[0]

    const newCountryCode = langObj.country.toLowerCase()
    const newPathSegments = [newCountryCode, ...pathSegments.slice(1)]
    const newPathname = "/" + newPathSegments.join("/")

    router.push(newPathname)
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-1 p-2 rounded">
        <Globe className={color} />
      </button>

      {open && (
        <ul className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-50">
          {languages.map((lang) => (
            <li key={lang.code}>
              <button
                onClick={() => changeLang(lang.code)}
                className="flex items-center gap-2 w-full text-left px-3 py-1 hover:bg-mysGreen-100 font-semibold font-archivo"
              >
                {/* <ReactCountryFlag
                  svg
                  style={{ width: "16px", height: "16px" }}
                  countryCode={lang.country}
                  aria-label={lang.label}
                /> */}
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
