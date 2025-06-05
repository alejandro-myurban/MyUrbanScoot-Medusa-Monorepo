"use client"

import type React from "react"
import { useEffect, useState, useRef, useMemo } from "react"
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
  const lastScrollY = useRef(0)
  const rafRef = useRef<number | null>(null)
  
  // Umbrales con histéresis
  const SCROLL_THRESHOLD_DOWN = 120
  const SCROLL_THRESHOLD_UP = 80

  useEffect(() => {
    let ticking = false

    const updateNavbar = () => {
      const currentScrollY = window.scrollY
      const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up'
      
      // Solo actualizar si realmente necesitamos cambiar
      if (scrollDirection === 'down' && currentScrollY > SCROLL_THRESHOLD_DOWN && !showMainNavbar) {
        setShowMainNavbar(true)
      } else if (scrollDirection === 'up' && currentScrollY < SCROLL_THRESHOLD_UP && showMainNavbar) {
        setShowMainNavbar(false)
      }
      
      lastScrollY.current = currentScrollY
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar)
        ticking = true
      }
    }

    // Inicializar
    const initialScrollY = window.scrollY
    setShowMainNavbar(initialScrollY > SCROLL_THRESHOLD_DOWN)
    lastScrollY.current = initialScrollY

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [showMainNavbar])

  // Memorizar las clases para evitar recálculos
  const bannerClasses = useMemo(() => {
    return `w-full transition-all duration-300 ease-out overflow-hidden ${
      !showMainNavbar ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
    }`
  }, [showMainNavbar])

  const darkNavbarClasses = useMemo(() => {
    return `absolute inset-0 transition-opacity duration-300 ${
      !showMainNavbar 
        ? "opacity-100 pointer-events-auto" 
        : "opacity-0 pointer-events-none"
    }`
  }, [showMainNavbar])

  const mainNavbarClasses = useMemo(() => {
    return `absolute inset-0 transition-opacity duration-300 ${
      showMainNavbar 
        ? "opacity-100 pointer-events-auto" 
        : "opacity-0 pointer-events-none"
    }`
  }, [showMainNavbar])

  // Estilos estáticos para evitar re-renders
  const hardwareAcceleration = {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
    WebkitBackfaceVisibility: 'hidden' as const
  }

  return (
    <>
      {/* Banner promocional */}
      <div className={bannerClasses}>
        <div className="bg-black w-full text-center h-8 text-white px-6 py-1 text-sm font-medium flex items-center justify-center">
          <PromoCarousel />
        </div>
      </div>

      {/* Contenedor único para ambas navbars */}
      <div className="sticky top-0 z-50 h-16" style={hardwareAcceleration}>
        {/* Navbar alternativo (oscuro) */}
        {alternativeNavbar && (
          <div
            className={darkNavbarClasses}
            style={hardwareAcceleration}
          >
            {alternativeNavbar}
          </div>
        )}

        {/* Navbar principal (claro) */}
        <div
          className={mainNavbarClasses}
          style={hardwareAcceleration}
        >
          {children}
        </div>
      </div>
    </>
  )
}