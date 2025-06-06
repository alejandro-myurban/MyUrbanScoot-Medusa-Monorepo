"use client"

import { usePathname } from "next/navigation"

interface ActiveNavItemProps {
  href: string
  children: React.ReactNode
  className?: string
  exactMatch?: boolean // Para match exacto vs includes
  activeClassName?: string // Personalizar estilos cuando está activo
  matchPatterns?: string[] // Patrones adicionales para considerar activo
}

export default function ActiveNavItem({
  href,
  children,
  className = "",
  exactMatch = false,
  activeClassName,
  matchPatterns = [],
}: ActiveNavItemProps) {
  const pathname = usePathname()
  
  // Función para normalizar rutas quitando el locale
  const normalizePathname = (path: string): string => {
    // Patrón para detectar locales comunes (es, en, fr, etc.)
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
    
    // Check si la ruta actual incluye el href
    const includesHref = normalizedPathname.includes(normalizedHref) && normalizedHref !== '/'
    
    // Check patrones adicionales
    const matchesPattern = matchPatterns.some(pattern => 
      normalizedPathname.includes(pattern)
    )
    
    return includesHref || matchesPattern
  }

  const active = isActive()
  
  // Estilos por defecto cuando está activo
  const defaultActiveStyles = 'font-bold after:content-[""] after:absolute after:top-2.5 after:-z-10 after:left-0 after:w-full after:h-1.5 after:bg-mysGreen-100 after:mt-1'
  
  // Usar estilos personalizados o por defecto
  const activeStyles = activeClassName || defaultActiveStyles

  return (
    <span
      className={`relative cursor-pointer transition-all duration-300 ${
        active ? activeStyles : ""
      } ${className}`}
    >
      {children}
    </span>
  )
}