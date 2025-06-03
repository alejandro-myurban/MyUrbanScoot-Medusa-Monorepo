"use client"

import type React from "react"

import { useEffect, useState } from "react"
import PromoCarousel from "../tooltip-carousel"

interface ScrollNavWrapperProps {
  children: React.ReactNode
  alternativeNavbar?: React.ReactNode
}

export default function ScrollNavWrapper({
  children,
  alternativeNavbar,
}: ScrollNavWrapperProps) {
  const [showMainNavbar, setShowMainNavbar] = useState(false)

  useEffect(() => {
    let ticking = false

    const updateNav = () => {
      const scrollY = window.scrollY
      const newShowMainNavbar = scrollY > 100

      if (newShowMainNavbar !== showMainNavbar) {
        setShowMainNavbar(newShowMainNavbar)
      }

      ticking = false
    }

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateNav)
        ticking = true
      }
    }

    // Inicializar
    updateNav()

    // Escuchar scroll
    window.addEventListener("scroll", requestTick, { passive: true })

    return () => {
      window.removeEventListener("scroll", requestTick)
    }
  }, [showMainNavbar])

  return (
    <>
      {/* Banner promocional - parte del flujo normal del documento */}
      <div
        className={`w-full transition-all duration-500 ease-out overflow-hidden ${
          !showMainNavbar ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-black w-full text-center h-8 text-white px-6 py-1 text-sm font-medium flex items-center justify-center">
          <PromoCarousel />
        </div>
      </div>

      {/* Navbar alternativo (oscuro) - visible inicialmente */}
      {alternativeNavbar && (
        <div
          className={`w-full transition-all duration-500 ease-out ${
            !showMainNavbar
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-full pointer-events-none absolute z-10 top-0 left-0 right-0"
          }`}
        >
          {alternativeNavbar}
        </div>
      )}

      {/* Navbar principal - se muestra con scroll */}
      <div
        className={`top-0 z-40 transition-all duration-500 ease-in-out ${
          showMainNavbar
            ? "sticky opacity-100 translate-y-0 pointer-events-auto"
            : "absolute opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        {children}
      </div>
    </>
  )
}
