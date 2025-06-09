"use client"
import React, { useEffect, useState } from "react"
import { Hits, InstantSearch, SearchBox, Configure } from "react-instantsearch"
import { searchClient } from "../../../../lib/config"
import Modal from "../../../common/components/modal"
import { Button } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, ShoppingBag } from "lucide-react"

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
  console.log("Rendering hit:", hit)
  const hasValidThumbnail =
    hit.thumbnail && hit.thumbnail !== null && hit.thumbnail !== ""

  return (
    <Link
      href={`/producto/${hit.handle}`}
      className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-gray-300"
    >
      <div className="aspect-square relative bg-gray-50">
        {hasValidThumbnail ? (
          <Image
            src={hit.thumbnail}
            alt={hit.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {hit.title}
        </h3>

        {hit.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {truncateText(hit.description, 80)}
          </p>
        )}

        {hit.price && (
          <div className="mt-3">
            <span className="text-lg font-semibold text-gray-900">
              {hit.price.calculated_price}{" "}
              {hit.price.currency_code?.toUpperCase()}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
          Ver producto
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}

const CustomHits = () => {
  return (
    <Hits
      hitComponent={Hit}
      classNames={{
        root: "mt-6",
        list: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        item: "",
      }}
    />
  )
}

const NoResults = () => (
  <div className="text-center py-12">
    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No encontramos productos
    </h3>
    <p className="text-gray-600">Intenta con otros términos de búsqueda</p>
  </div>
)

export default function SearchModal({ dark = false }: { dark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <div className="hidden small:flex items-center gap-x-6 h-full">
        <Button
          onClick={() => setIsOpen(true)}
          variant="transparent"
          className={`text-white/90 hover:text-white font-dmSans text-base px-0 hover:bg-transparent focus:!bg-transparent flex items-center gap-2 transition-all ${
            dark ? "text-white/80 hover:text-white rounded-xl py-1 px-3 bg-gray-500" : "text-black hover:text-black/90 rounded-xl py-1 px-3 bg-gray-200"
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

      <Modal isOpen={isOpen} close={() => setIsOpen(false)}>
        <div className="w-full max-w-4xl mx-auto">
          <InstantSearch
            searchClient={searchClient}
            indexName={process.env.NEXT_PUBLIC_ALGOLIA_PRODUCT_INDEX_NAME}
          >
            {/* Configuración para limitar resultados */}
            <Configure hitsPerPage={9} />

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Buscar productos
              </h2>
              <SearchBox
                placeholder="¿Qué estás buscando?"
                classNames={{
                  root: "relative",
                  form: "relative",
                  input:
                    "w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg",
                  submit:
                    "absolute right-3 top-1/2 transform -translate-y-1/2 p-1",
                  submitIcon: "w-5 h-5 text-gray-400",
                  reset:
                    "absolute right-10 top-1/2 transform -translate-y-1/2 p-1 hover:text-gray-600",
                  resetIcon: "w-4 h-4 text-gray-400",
                }}
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              <CustomHits />
            </div>

            {/* Componente para mostrar cuando no hay resultados */}
            <div className="ais-Hits">
              <div className="ais-Hits-list">
                {/* React InstantSearch manejará automáticamente mostrar NoResults cuando no haya hits */}
              </div>
            </div>
          </InstantSearch>
        </div>
      </Modal>
    </>
  )
}
