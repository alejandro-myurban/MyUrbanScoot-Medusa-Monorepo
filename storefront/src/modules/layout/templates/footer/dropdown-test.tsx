// src/components/layout/navbar/vinyl-nav-dropdown.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { motion, AnimatePresence } from "framer-motion"

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

// Variantes de animación para el dropdown principal
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
}

// Variantes para cada item del menú
const itemVariants = {
  hidden: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15
    }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

// Variantes para el submenu (modelos)
const submenuVariants = {
  hidden: {
    opacity: 0,
    x: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeInOut"
    }
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut",
      staggerChildren: 0.03,
      delayChildren: 0.03
    }
  },
  exit: {
    opacity: 0,
    x: -5,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
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
      <div
        className="relative"
        onMouseEnter={handleOpenMenu}
        onMouseLeave={handleCloseMenu}
      >
        <LocalizedClientLink
          href={`/categories/${vinylsCategory?.handle || "vinilos"}`}
          className={clx(
            "block py-4 px-2 text-black/80 hover:text-black transition-colors",
            isOpen && "font-medium"
          )}
        >
          {vinylsCategory?.name || "Vinilos"}
          <motion.svg
            className="w-3 h-3 ml-1 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </motion.svg>
        </LocalizedClientLink>

        {/* Dropdown con las MARCAS */}
        <AnimatePresence>
          {isOpen && brands.length > 0 && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute left-0 mt-1 bg-white shadow-lg rounded-md border border-ui-border-base min-w-64 z-50 "
              onMouseEnter={handleOpenMenu}
              onMouseLeave={handleCloseMenu}
            >
              {/* Área de "amortiguación" superior */}
              <div className="h-2 absolute -top-2 left-0 right-0"></div>

              <motion.ul className="py-3">
                {brands.map((brand, index) => (
                  <motion.li
                    key={brand.id}
                    className="relative"
                    variants={itemVariants}
                    custom={index}
                  >
                    <motion.div
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
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
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
                          <motion.span
                            className="mr-4 text-ui-fg-subtle"
                            animate={{ x: activeChild === brand.id ? 2 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
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
                          </motion.span>
                        )}
                    </motion.div>

                    {/* Sub-dropdown para MODELOS */}
                    <AnimatePresence>
                      {activeChild === brand.id &&
                        brand.category_children &&
                        brand.category_children.length > 0 && (
                          <motion.div
                            variants={submenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute left-full top-0 bg-white shadow-lg rounded-md border border-ui-border-base min-w-56 -ml-1 z-50 "
                            onMouseEnter={() => {
                              handleOpenMenu()
                              setActiveChild(brand.id)
                            }}
                            onMouseLeave={handleCloseMenu}
                          >
                            {/* Área de "conexión" */}
                            <div className="absolute -left-4 top-0 bottom-0 w-4"></div>

                            <motion.ul className="py-3">
                              {brand.category_children.map((model, modelIndex) => (
                                <motion.li
                                  key={model.id}
                                  variants={itemVariants}
                                  custom={modelIndex}
                                >
                                  <motion.div
                                    whileHover={{ x: 3, backgroundColor: "rgba(0, 255, 0, 0.1)" }}
                                    transition={{ duration: 0.2 }}
                                  >
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
                                  </motion.div>
                                </motion.li>
                              ))}
                              <motion.li
                                className="border-t border-ui-border-base mt-2 pt-2"
                                variants={itemVariants}
                                custom={brand.category_children.length}
                              >
                                <motion.div
                                  whileHover={{ x: 2 }}
                                  transition={{ duration: 0.2 }}
                                >
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
                                </motion.div>
                              </motion.li>
                            </motion.ul>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </motion.li>
                ))}

                <motion.li
                  className="border-t border-ui-border-base mt-2 pt-2"
                  variants={itemVariants}
                  custom={brands.length}
                >
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
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
                  </motion.div>
                </motion.li>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}