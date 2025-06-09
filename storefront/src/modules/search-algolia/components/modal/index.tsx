"use client"
import React, { useEffect, useState, useRef } from "react"
import { Hits, InstantSearch, SearchBox, Configure } from "react-instantsearch"
import { searchClient } from "../../../../lib/config"
import { Button } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, ShoppingBag, X } from "lucide-react"

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

const Hit = ({ hit }: { hit: Hit }) => {
  const hasValidThumbnail =
    hit.thumbnail && hit.thumbnail !== null && hit.thumbnail !== ""

  return (
    <Link
      href={`/producto/${hit.handle}`}
      className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors rounded-lg"
    >
      <div className="w-16 h-16 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
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
      </div>

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
  )
}

const CustomHits = () => {
  return (
    <Hits
      hitComponent={Hit}
      transformItems={(items) => {
        // Filtrar resultados que no tengan sentido
        return items.filter((item) => {
          // Aquí podrías añadir lógica para filtrar resultados absurdos
          return item.title && item.title.length > 0
        })
      }}
      classNames={{
        root: "",
        list: "divide-y divide-gray-100",
        item: "",
      }}
    />
  )
}

const NoResults = () => (
  <div className="text-center py-12">
    <p className="text-gray-500">No hay resultados con esa búsqueda</p>
  </div>
)

export default function SearchModal({ dark = false }: { dark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("keydown", handleEsc)
    }
  }, [isOpen])

  return (
    <>
      <div className="hidden small:flex items-center gap-x-6 h-full">
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
          Buscar
        </Button>
      </div>

      {/* Modal de búsqueda */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay con blur */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Modal content */}
          <div className="relative flex justify-center pt-[10vh]">
            <div
              ref={modalRef}
              className="relative w-full bottom-20 bg-white/80 rounded-lg shadow-xl"
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

                {/* Header con input de búsqueda */}
                <div className="relative">
                  <SearchBox
                    placeholder="Ejemplo: Teverun Fighter"
                    classNames={{
                      root: "relative max-w-screen-xl mx-auto ",
                      form: "relative",
                      input:
                        "w-full rounded-3xl px-12 py-4 text-base border-0 focus:outline-none focus:ring-0 placeholder-gray-500",
                      submit:
                        "absolute left-4 top-1/2 transform -translate-y-1/2",
                      submitIcon: "w-5 h-5 text-gray-400",
                      reset: "hidden",
                    }}
                    ref={searchInputRef}
                    onChangeCapture={(e: any) => setSearchQuery(e.target.value)}
                  />

                  {/* Botón de cerrar */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Línea divisoria */}
                <div className="border-t border-gray-200" />

                {/* Resultados */}
                <div className="max-h-[400px] overflow-y-auto">
                  {searchQuery && (
                    <>
                      {/* Lista de productos */}
                      <div className="px-4 pb-4">
                        <CustomHits />
                      </div>
                    </>
                  )}

                  {/* Mensaje cuando no hay búsqueda */}
                  {!searchQuery && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-gray-500">
                        Empieza a escribir para buscar productos
                      </p>
                    </div>
                  )}

                  {/* Si hay búsqueda pero no resultados */}
                  {searchQuery && (
                    <div className="empty:hidden">
                      <div className="ais-Hits--empty">
                        <NoResults />
                      </div>
                    </div>
                  )}
                </div>
              </InstantSearch>
            </div>
          </div>
        </div>
      )}
    </>
  )
}