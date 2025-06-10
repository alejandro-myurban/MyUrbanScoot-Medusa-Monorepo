"use client"

import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"

interface ActiveNavItemProps {
  href: string
  children?: React.ReactNode
  className?: string
  exactMatch?: boolean
  activeClassName?: string
  matchPatterns?: string[]
  // 🔥 Nueva prop para la clave de traducción
  translationKey?: string
  // 🔥 Namespace para las traducciones (opcional)
  translationNamespace?: string
}

export default function ActiveNavItem({
  href,
  children,
  className = "",
  exactMatch = false,
  activeClassName,
  matchPatterns = [],
  translationKey,
}: ActiveNavItemProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  
  // Función para normalizar rutas quitando el locale
  const normalizePathname = (path: string): string => {
    const localePattern = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/
    return path.replace(localePattern, '') || '/'
  }
  
  // Lógica para determinar si está activo
  const isActive = (): boolean => {
    const normalizedPathname = normalizePathname(pathname)
    const normalizedHref = normalizePathname(href)
    
    if (exactMatch) {
      return normalizedPathname === normalizedHref
    }
    
    const includesHref = normalizedPathname.includes(normalizedHref) && normalizedHref !== '/'
    const matchesPattern = matchPatterns.some(pattern => 
      normalizedPathname.includes(pattern)
    )
    
    return includesHref || matchesPattern
  }

  const active = isActive()
  
  const hoverStyles = {
    '--BORDER-WIDTH': '2px',
  } as React.CSSProperties

  // 🔥 Decidir qué mostrar: traducción o children
  const displayText = translationKey ? t(translationKey) : children

  return (
    <span
      className={`
        relative 
        cursor-pointer 
        transition-all 
        duration-300
        after:content-[''] 
        after:absolute 
        after:left-1/2 
        after:bottom-[-0.1rem] 
        after:w-0
        after:h-[var(--BORDER-WIDTH)] 
        after:block 
        after:bg-mysGreen-100
        after:transition-all
        after:duration-500
        after:ease-out
        after:pointer-events-none
        after:-translate-x-1/2
        after:rounded-full
        hover:after:w-full
        hover:after:ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]
        hover:-translate-y-0.5
        ${active ? 'font-bold after:w-full after:absolute after:top-3.5 after:-z-10 after:h-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : ''}
        ${activeClassName && active ? activeClassName : ''}
        ${className}
      `}
      style={hoverStyles}
    >
      {displayText}
    </span>
  )
}