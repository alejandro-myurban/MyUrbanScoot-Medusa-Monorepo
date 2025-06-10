"use client"
import React, { Suspense, useEffect, useState } from "react"
import {
  Hits,
  InstantSearch,
  SearchBox,
  Configure,
  Pagination,
  Stats,
  useInstantSearch,
} from "react-instantsearch"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ShoppingBag, Search } from "lucide-react"
import { searchClient } from "@lib/config"

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

const stripHtml = (html: string) => {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "").trim()
}

const truncateText = (text: string, maxLength: number = 150) => {
  if (!text) return ""
  const cleanText = stripHtml(text)
  return cleanText.length > maxLength
    ? cleanText.substring(0, maxLength) + "..."
    : cleanText
}

const SearchPageHit = ({ hit }: { hit: Hit }) => {
  const hasValidThumbnail =
    hit.thumbnail && hit.thumbnail !== null && hit.thumbnail !== ""

  return (
    <Link
      href={`/producto/${hit.handle}`}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors rounded-lg border border-gray-100 bg-white"
    >
      <div className="w-20 h-20 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
        {hasValidThumbnail ? (
          <Image
            src={hit.thumbnail}
            alt={hit.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-gray-900 truncate mb-1">
          {hit.title}
        </h3>

        {hit.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {truncateText(hit.description, 120)}
          </p>
        )}

        {hit.price && (
          <p className="text-sm text-gray-600">
            {hit.price.calculated_price}{" "}
            {hit.price.currency_code?.toUpperCase()}
          </p>
        )}
      </div>
    </Link>
  )
}

const NoResultsMessage = ({ query }: { query: string }) => (
  <div className="text-center py-16">
    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No encontramos resultados para "{query}"
    </h3>
    <p className="text-gray-500 mb-6">
      Intenta con otros términos de búsqueda o revisa la ortografía
    </p>
  </div>
)

// Componente simple para sincronización unidireccional
function URLSync() {
  const { setIndexUiState } = useInstantSearch()
  const searchParams = useSearchParams()
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (!hasInitialized) {
      const query = searchParams.get("q") || ""
      const page = parseInt(searchParams.get("page") || "1", 10)
      
      console.log("🎯 Inicializando estado:", { query, page })
      
      setIndexUiState({
        query,
        page,
      })
      
      setHasInitialized(true)
    }
  }, [hasInitialized, searchParams, setIndexUiState])

  return null
}

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  console.log("🌐 Renderizando SearchResults con query:", query)

  if (!query) {
    return (
      <div className="text-center py-16">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Realiza una búsqueda
        </h3>
        <p className="text-gray-500">
          Usa el buscador para encontrar productos
        </p>
      </div>
    )
  }

  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_PRODUCT_INDEX_NAME!

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        key={`search-${query}`} // Key único para forzar re-mount
      >
        <URLSync />
        <Configure hitsPerPage={20} />

        {/* Header con buscador */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Resultados para: "{query}"
          </h1>

          <div className="w-full">
            <SearchBox
              placeholder="Buscar productos..."
              classNames={{
                root: "relative",
                form: "relative",
 input: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mysGreen-100 focus:border-transparent focus:outline-none [&:focus]:shadow-none",
                submit: "absolute left-3 top-1/2 transform -translate-y-1/2",
                submitIcon: "w-5 h-5 text-gray-400",
                reset: "hidden",
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <Stats
            classNames={{
              root: "text-sm text-gray-600",
            }}
          />
        </div>

        {/* Resultados */}
        <div className="mb-8">
          <Hits
            hitComponent={SearchPageHit}
            transformItems={(items) => {
              console.log("🔍 HITS RECIBIDOS:", {
                total: items.length,
                primer: items[0]?.title?.substring(0, 30) + "...",
                ultimo: items[items.length - 1]?.title?.substring(0, 30) + "...",
                primerID: items[0]?.objectID,
                ultimoID: items[items.length - 1]?.objectID
              })
              return items
            }}
            classNames={{
              root: "",
              list: "divide-y divide-gray-100 bg-white rounded-lg border border-gray-200",
              item: "",
            }}
            //@ts-ignore
            emptyComponent={() => <NoResultsMessage query={query} />}
          />
        </div>

        {/* Paginación */}
        {/* <div className="flex justify-center">
          <Pagination
            padding={3}
            showFirst={true}
            showPrevious={true}
            showNext={true}
            showLast={true}
            classNames={{
              root: "flex items-center space-x-1",
              list: "flex items-center space-x-1",
              item: "px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors",
              selectedItem:
                "px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md",
              disabledItem:
                "px-3 py-2 text-sm font-medium text-gray-300 border border-gray-300 rounded-md cursor-not-allowed",
              link: "block",
              firstPageItem:
                "px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50",
              lastPageItem:
                "px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50",
              previousPageItem:
                "px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50",
              nextPageItem:
                "px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50",
            }}
          />
        </div> */}
      </InstantSearch>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SearchResults />
    </Suspense>
  )
}