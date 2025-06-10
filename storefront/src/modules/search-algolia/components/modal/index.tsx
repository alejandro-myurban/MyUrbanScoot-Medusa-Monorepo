"use client"
import React, { useEffect, useState, useRef } from "react"
import { Hits, InstantSearch, SearchBox, Configure } from "react-instantsearch"
import { searchClient } from "../../../../lib/config"
import { Button } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, ShoppingBag, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"

type Hit = {
  objectID: string
  id: string
  title: string
  description: string
  handle: string
  thumbnail: string
  price?: {
    calculated_price: string
    currency_code: string
  }
}

// Función para limpiar HTML del rich text editor
const stripHtml = (html: string) => {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "").trim()
}

// Función para truncar texto
const truncateText = (text: string, maxLength: number = 100) => {
  if (!text) return ""
  const cleanText = stripHtml(text)
  return cleanText.length > maxLength
    ? cleanText.substring(0, maxLength) + "..."
    : cleanText
}

const Hit = ({ hit, index }: { hit: Hit; index: number }) => {
  const hasValidThumbnail =
    hit.thumbnail && hit.thumbnail !== null && hit.thumbnail !== ""

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05, // Animación escalonada
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      <Link
        href={`/producto/${hit.handle}`}
        className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors rounded-lg"
      >
        <motion.div
          className="w-16 h-16 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {hasValidThumbnail ? (
            <Image
              src={hit.thumbnail}
              alt={hit.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {hit.title}
          </h3>
          {hit.price && (
            <p className="text-sm text-gray-600 mt-1">
              {hit.price.calculated_price}{" "}
              {hit.price.currency_code?.toUpperCase()}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

const CustomHits = () => {
  return (
    <Hits
      //@ts-ignore
      hitComponent={({ hit, index }) => <Hit hit={hit} index={index} />}
      transformItems={(items) => {
        return items.filter((item) => {
          return item.title && item.title.length > 0
        })
      }}
      classNames={{
        root: "max-w-screen-xl mx-auto",
        list: "divide-y divide-gray-300",
        item: "",
      }}
    />
  )
}

const NoResults = () => (
  <motion.div
    className="text-center py-12"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <p className="text-gray-500">No hay resultados con esa búsqueda</p>
  </motion.div>
)

export default function SearchModal({ dark = false }: { dark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const {t} = useTranslation()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Cerrar modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Focus en el input al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Cerrar con ESC y manejar Enter
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }

      if (event.key === "Enter" && isOpen && searchQuery.trim()) {
        event.preventDefault()
        handleSearchSubmit()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, searchQuery])

  // Función para manejar el submit del formulario
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (searchQuery.trim()) {
      setIsOpen(false)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      {/* Versión para escritorio */}
      <div className="hidden small:flex items-center gap-x-6 h-full">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            variant="transparent"
            className={`text-white/90 hover:text-white font-dmSans text-base px-0 hover:bg-transparent focus:!bg-transparent flex items-center gap-2 transition-all ${
              dark
                ? "text-white/80 hover:text-white rounded-xl py-1 px-3 bg-gray-500"
                : "text-black hover:text-black/90 rounded-xl py-1 px-3 bg-gray-200"
            }`}
          >
            <Search
              className={`hover:text-ui-fg-base w-6 h-6 ${
                dark ? "text-white/80 hover:text-white" : "text-black"
              }`}
            />
            {t("navigation.search")}
          </Button>
        </motion.div>
      </div>

      {/* Versión para móvil */}
      <div className="flex small:hidden items-center">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${
            dark
              ? "text-white/80 hover:text-white hover:bg-gray-100/10"
              : "text-black/80 hover:text-black hover:bg-gray-100/10"
          }`}
        >
          <Search className="w-6 h-6" />
          <span className="text-base font-semibold">Buscar</span>
        </motion.button>
      </div>

      {/* Modal de búsqueda con AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overlay con blur animado */}
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            <div className="relative flex justify-center pt-[5vh] sm:pt-[10vh] px-4 sm:px-0">
              <motion.div
                ref={modalRef}
                style={{width: "100%"}}
                className="relative w-full sm:w-auto sm:bottom-20 bg-white shadow-xl rounded-lg sm:rounded-none overflow-hidden sm:overflow-visible"
                initial={{
                  opacity: 0,
                  y: -50,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -30,
                  scale: 0.95,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                <InstantSearch
                  searchClient={searchClient}
                  indexName={process.env.NEXT_PUBLIC_ALGOLIA_PRODUCT_INDEX_NAME}
                >
                  <Configure
                    typoTolerance="strict"
                    minWordSizefor1Typo={4}
                    minWordSizefor2Typos={8}
                    hitsPerPage={5}
                  />

                  {/* Barra de búsqueda - desktop original, móvil mejorado */}
                  <motion.form
                    onSubmit={handleSearchSubmit}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <div className="relative max-w-screen-xl mx-auto">
                      <SearchBox
                        autoFocus={true}
                        placeholder="Ejemplo: Teverun Fighter"
                        classNames={{
                          root: "relative max-w-screen-xl mx-auto py-4 px-4 sm:px-0",
                          form: "relative",
                          input:
                            "w-full rounded-lg sm:rounded-3xl bg-gray-200 px-10 sm:px-12 py-3 sm:py-2 text-sm sm:text-base border-0 focus:outline-none focus:ring-0 sm:focus:ring-0 focus:ring-2 focus:ring-mysGreen-100 sm:focus:ring-0 placeholder-gray-500 transition-all duration-300 focus:bg-gray-100",
                          submit:
                            "absolute left-6 sm:left-4 top-1/2 transform -translate-y-1/2",
                          submitIcon: "w-4 h-4 sm:w-5 sm:h-5 text-gray-400",
                          reset: "hidden",
                        }}
                        ref={searchInputRef}
                        onChangeCapture={(e: any) =>
                          setSearchQuery(e.target.value)
                        }
                        submitIconComponent={() => null}
                      />

                      {/* Botón submit */}
                      <button
                        type="submit"
                        className="absolute left-6 sm:left-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        </motion.div>
                      </button>

                      {/* Botón cerrar */}
                      <button
                        onClick={() => setIsOpen(false)}
                        type="button"
                        className="absolute right-6 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <motion.div
                          whileHover={{ rotate: 90, scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{ duration: 0.15 }}
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        </motion.div>
                      </button>
                    </div>
                  </motion.form>

                  {/* Línea divisoria */}
                  <motion.div
                    className="border-t border-gray-200"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  />

                  {/* Resultados */}
                  <motion.div
                    className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <AnimatePresence mode="wait">
                      {searchQuery && (
                        <motion.div
                          key="search-results"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-4 pb-4">
                            <CustomHits />
                          </div>

                          {/* Enlace para ver todos los resultados */}
                          {searchQuery.trim() && (
                            <motion.div
                              className="px-4 pb-4 border-t border-gray-100"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4, duration: 0.3 }}
                            >
                              <Link
                                href={`/search?q=${encodeURIComponent(
                                  searchQuery.trim()
                                )}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 py-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                              >
                                <Search className="w-4 h-4" />
                                Ver todos los resultados para "{searchQuery}"
                              </Link>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* Mensaje cuando no hay búsqueda */}
                      {!searchQuery && (
                        <motion.div
                          key="no-search"
                          className="px-4 py-8 text-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-gray-500 text-sm">
                            Empieza a escribir para buscar productos
                          </p>
                        </motion.div>
                      )}

                      {/* Si hay búsqueda pero no resultados */}
                      {searchQuery && (
                        <div className="empty:hidden">
                          <div className="ais-Hits--empty">
                            <NoResults />
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </InstantSearch>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
