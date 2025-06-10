// src/components/layout/navbar/vinyl-nav-dropdown.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"

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
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
}

// Variantes para cada item del menú
const itemVariants = {
  hidden: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15,
    },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
}

// Variantes para el submenu (modelos)
const submenuVariants = {
  hidden: {
    opacity: 0,
    x: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut",
      staggerChildren: 0.03,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    x: -5,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
}

// Componente cliente que maneja la interactividad
export default function DarkVinylNavDropdown({
  isDark = false,
  categories,
}: {
  isDark: boolean
  categories: Category[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const {t} = useTranslation()

  // Obtenemos solo la categoría "Vinilos" (primer elemento) y sus hijos (marcas)
  const vinylsCategory = categories[0] // Vinilos es el primer elemento
  const brands = vinylsCategory?.category_children || [] // Las marcas (Kugoo, Dualtron, etc.)

  // Función para normalizar rutas quitando el locale
  const normalizePathname = (path: string): string => {
    const localePattern = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/
    return path.replace(localePattern, "") || "/"
  }

  // Función para determinar si está activo
  const isActive = (handle: string): boolean => {
    const normalizedPathname = normalizePathname(pathname)
    const normalizedHandle = normalizePathname(`/categories/${handle}`)

    return (
      normalizedPathname.includes(normalizedHandle) &&
      normalizedHandle !== "/categories/"
    )
  }

  // Verificar si alguna subcategoría está activa
  const isParentActive = (): boolean => {
    // Verificar si la categoría principal está activa
    if (vinylsCategory && isActive(vinylsCategory.handle)) {
      return true
    }

    // Verificar si alguna marca está activa
    return brands.some((brand) => {
      if (isActive(brand.handle)) return true

      // Verificar si algún modelo de la marca está activo
      return (
        brand.category_children?.some((model) => isActive(model.handle)) ||
        false
      )
    })
  }

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

  // Estilos CSS-in-JS para el underline hover
  const hoverStyles = {
    "--BORDER-WIDTH": "2px",
  } as React.CSSProperties

  const parentActive = isParentActive()

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
            "relative block px-2 transition-all duration-300",
            // Estilos del underline hover chulo
            "after:content-[''] after:absolute after:left-1/2 after:bottom-[-0.1rem]",
            "after:w-0 after:h-[var(--BORDER-WIDTH)] after:block after:bg-mysGreen-100",
            "after:transition-all after:duration-500 after:ease-out after:pointer-events-none",
            "after:-translate-x-1/2 after:rounded-full",
            "hover:after:w-full hover:after:ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
            "hover:text-white",
            // Estilos cuando está activo
            parentActive &&
              "font-bold text-white after:w-full drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]  after:absolute after:top-4 after:-z-10 after:h-1",
            isOpen && "font-medium",
            isDark
              ? "text-black/80 hover:text-black"
              : "text-white/80 hover:text-white"
          )}
          style={hoverStyles}
        >
          {t("navigation.vinyls")}
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
                {brands.map((brand, index) => {
                  const brandActive =
                    isActive(brand.handle) ||
                    brand.category_children?.some((model) =>
                      isActive(model.handle)
                    ) ||
                    false

                  return (
                    <motion.li
                      key={brand.id}
                      className="relative"
                      variants={itemVariants}
                      custom={index}
                    >
                      <motion.div
                        className={clx(
                          "flex items-center justify-between transition-colors",
                          brandActive && "bg-mysGreen-100 font-semibold",
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
                          className={clx(
                            "block px-6 py-3 flex-grow transition-colors",
                            brandActive
                              ? "font-bold text-mysGreen-600"
                              : "font-semibold"
                          )}
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
                                {brand.category_children.map(
                                  (model, modelIndex) => {
                                    const modelActive = isActive(model.handle)

                                    return (
                                      <motion.li
                                        key={model.id}
                                        variants={itemVariants}
                                        custom={modelIndex}
                                      >
                                        <motion.div
                                          whileHover={{
                                            x: 3,
                                            backgroundColor: modelActive
                                              ? "rgba(0, 255, 0, 0.2)"
                                              : "rgba(0, 255, 0, 0.1)",
                                          }}
                                          transition={{ duration: 0.2 }}
                                          className={clx(
                                            modelActive && "bg-mysGreen-100"
                                          )}
                                        >
                                          <LocalizedClientLink
                                            href={`/categories/${model.handle}`}
                                            className={clx(
                                              "block px-6 py-3 hover:bg-mysGreen-100 transition-colors whitespace-nowrap",
                                              modelActive
                                                ? "font-bold text-mysGreen-600"
                                                : "font-semibold"
                                            )}
                                            onClick={() => {
                                              setIsOpen(false)
                                              setActiveChild(null)
                                            }}
                                          >
                                            {model.name}
                                          </LocalizedClientLink>
                                        </motion.div>
                                      </motion.li>
                                    )
                                  }
                                )}
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
                  )
                })}

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
                      href={`/categories/${
                        vinylsCategory?.handle || "vinilos"
                      }`}
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
