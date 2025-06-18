// components/nav-conditional.tsx
"use client"

import React from "react"
import { usePathname } from "next/navigation"
import ScrollNavWrapper from "../scroll-nav-wrapper"

interface NavConditionalProps {
  mainNavbar: React.ReactNode
  darkNavbar: React.ReactNode
}

export default function NavConditional({
  mainNavbar,
  darkNavbar,
}: NavConditionalProps) {
  const pathname = usePathname()

  // Determinar si estamos en la página de inicio
  const isHomePage =
    pathname === "/" || pathname === "/es" || pathname === "/en"

  console.log("Pathname:", pathname, "Is Home:", isHomePage) // Para debug

  // Si NO es home page, solo mostrar el navbar principal (blanco)
  if (!isHomePage) {
    return <div className="sticky top-0 z-50 h-16">{mainNavbar}</div>
  }

  // Si ES home page, mostrar el comportamiento dual con ScrollNavWrapper
  return (
    <ScrollNavWrapper alternativeNavbar={darkNavbar}>
      {mainNavbar}
    </ScrollNavWrapper>
  )
}
