// src/components/layout/navbar/vinyl-nav-dropdown.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Los tipos ayudan a entender la estructura de datos
type CategoryChild = {
  id: string
  name: string
  handle: string
  category_children?: CategoryChild[] // Permite nietos recursivamente
}

type Category = {
  id: string
  name: string
  handle: string
  parent_category: any | null
  category_children?: CategoryChild[]
}

// Componente cliente que maneja la interactividad
export default function VinylNavDropdown({
  categories,
}: {
  categories: Category[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)


  // Obtenemos solo la categoría "Vinilos" (primer elemento) y sus hijos (marcas)
  const vinylsCategory = categories[0] // Vinilos es el primer elemento
  const brands = vinylsCategory?.category_children || [] // Las marcas (Kugoo, Dualtron, etc.)

  // Función para abrir el menú
  const handleOpenMenu = () => {
    // Si hay un timeout pendiente para cerrar, lo cancelamos
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    setIsOpen(true)
    // Por defecto, no activamos ninguna marca hasta que hagan hover
    setActiveChild(null)
  }

  // Función para cerrar el menú con un retraso
  const handleCloseMenu = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setActiveChild(null)
    }, 300)
  }

  // Cancelar cualquier timeout pendiente al desmontar el componente
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  // Detectar clicks fuera del menú para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveChild(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <nav className="relative" ref={menuRef}>
      {/* Solo mostramos VINILOS en el navbar */}
      <div
        className="relative"
        onMouseEnter={handleOpenMenu}
        onMouseLeave={handleCloseMenu}
      >
        <LocalizedClientLink
          href={`/categories/${vinylsCategory?.handle || "vinilos"}`}
          className={clx(
            "block py-4 px-2 text-ui-fg-base hover:text-ui-fg-subtle transition-colors",
            isOpen && "font-medium"
          )}
        >
          {vinylsCategory?.name || "Vinilos"}
          <svg
            className="w-3 h-3 ml-1 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </LocalizedClientLink>

        {/* Dropdown con las MARCAS */}
        {isOpen && brands.length > 0 && (
          <div
            className="absolute left-0 mt-1 bg-white shadow-lg rounded-md border border-ui-border-base min-w-64 z-50"
            onMouseEnter={handleOpenMenu}
            onMouseLeave={handleCloseMenu}
          >
            {/* Área de "amortiguación" superior */}
            <div className="h-2 absolute -top-2 left-0 right-0"></div>

            <ul className="py-3">
              {brands.map((brand) => (
                <li key={brand.id} className="relative">
                  <div
                    className={clx(
                      "flex items-center justify-between transition-colors",
                      activeChild === brand.id
                        ? "bg-ui-bg-subtle hover:bg-mysGreen-100"
                        : "hover:bg-mysGreen-100"
                    )}
                    onMouseEnter={() => {
                      handleOpenMenu()
                      setActiveChild(brand.id)
                    }}
                  >
                    <LocalizedClientLink
                      href={`/categories/${brand.handle}`}
                      className="block px-6 py-3 font-semibold flex-grow"
                      onClick={() => {
                        setIsOpen(false)
                        setActiveChild(null)
                      }}
                    >
                      {brand.name}
                    </LocalizedClientLink>

                    {/* Flecha para MODELOS si existen */}
                    {brand.category_children &&
                      brand.category_children.length > 0 && (
                        <span className="mr-4 text-ui-fg-subtle">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            ></path>
                          </svg>
                        </span>
                      )}
                  </div>

                  {/* Sub-dropdown para MODELOS */}
                  {activeChild === brand.id &&
                    brand.category_children &&
                    brand.category_children.length > 0 && (
                      <div
                        className="absolute left-full top-0 bg-white shadow-lg rounded-md border border-ui-border-base min-w-56 -ml-1 z-50"
                        onMouseEnter={() => {
                          handleOpenMenu()
                          setActiveChild(brand.id)
                        }}
                        onMouseLeave={handleCloseMenu}
                      >
                        {/* Área de "conexión" */}
                        <div className="absolute -left-4 top-0 bottom-0 w-4"></div>

                        <ul className="py-3">
                          {brand.category_children.map((model) => (
                            <li key={model.id}>
                              <LocalizedClientLink
                                href={`/categories/${model.handle}`}
                                className="block px-6 py-3 font-semibold hover:bg-mysGreen-100 transition-colors whitespace-nowrap"
                                onClick={() => {
                                  setIsOpen(false)
                                  setActiveChild(null)
                                }}
                              >
                                {model.name}
                              </LocalizedClientLink>
                            </li>
                          ))}
                          <li className="border-t border-ui-border-base mt-2 pt-2">
                            <LocalizedClientLink
                              href={`/categories/${brand.handle}`}
                              className="block px-6 py-3 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle transition-colors text-sm"
                              onClick={() => {
                                setIsOpen(false)
                                setActiveChild(null)
                              }}
                            >
                              Ver todo en {brand.name}
                            </LocalizedClientLink>
                          </li>
                        </ul>
                      </div>
                    )}
                </li>
              ))}

              <li className="border-t border-ui-border-base mt-2 pt-2">
                <LocalizedClientLink
                  href={`/categories/${vinylsCategory?.handle || "vinilos"}`}
                  className="block px-6 py-3 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle transition-colors text-sm"
                  onClick={() => {
                    setIsOpen(false)
                    setActiveChild(null)
                  }}
                >
                  Ver todos los vinilos
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  )
}
