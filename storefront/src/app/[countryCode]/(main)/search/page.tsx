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
  RangeInput,
  RefinementList as AlgoliaRefinementList,
  CurrentRefinements,
} from "react-instantsearch"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ShoppingBag, Search, Filter, X } from "lucide-react"
import { searchClient } from "@lib/config"
import { Text } from "@medusajs/ui"
import { ProductAverageReview } from "@modules/product-reviews/components/ProductAverageReview"
import PriceFilterWrapperTwo from "@modules/common/components/price-filter"

type Hit = {
  objectID: string
  id: string
  title: string
  description: string
  handle: string
  thumbnail: string
  categories?: Array<any>
  tags?: Array<any>
  variants?: Array<{
    id: string
    calculated_price?: {
      calculated_amount: number
      calculated_price: {
        id: string
        price_list_id: string
        price_list_type: string
        min_quantity: number | null
        max_quantity: number | null
      }
      currency_code: string
      id: string
      is_calculated_price_price_list: boolean
      is_calculated_price_tax_inclusive: boolean
      is_original_price_price_list: boolean
      is_original_price_tax_inclusive: boolean
      original_amount: number
    }
    prices?: Array<{
      amount: number
      currency_code: string
      created_at: string
      deleted_at: string | null
      id: string
      max_quantity: number | null
      min_quantity: number | null
      price_list: any
      price_list_id: string | null
      price_set_id: string
      raw_amount: { value: string; precision: number }
      rules_count: number
      title: string | null
      updated_at: string
    }>
  }>
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

// Función para extraer el precio del hit (busca el menor precio entre todas las variantes)
const extractPriceFromHit = (hit: Hit) => {
  if (!hit || !hit.variants || hit.variants.length === 0) return null

  let bestPriceData = null
  let lowestCalculatedPrice = Infinity

  // Revisar todas las variantes para encontrar el menor precio
  for (const variant of hit.variants) {
    if (!variant) continue

    // Priorizar calculated_price si existe
    if (variant.calculated_price) {
      const priceData = variant.calculated_price

      if (priceData.calculated_amount < lowestCalculatedPrice) {
        lowestCalculatedPrice = priceData.calculated_amount

        // Formatear el precio según la moneda
        const formattedCalculatedPrice =
          priceData.currency_code === "eur"
            ? `€${priceData.calculated_amount.toFixed(2)}`
            : `${priceData.calculated_amount.toFixed(
                2
              )} ${priceData.currency_code.toUpperCase()}`

        const formattedOriginalPrice =
          priceData.currency_code === "eur"
            ? `€${priceData.original_amount.toFixed(2)}`
            : `${priceData.original_amount.toFixed(
                2
              )} ${priceData.currency_code.toUpperCase()}`

        // Calcular porcentaje de descuento
        let discountPercent: number | null = null
        if (priceData.original_amount > priceData.calculated_amount) {
          discountPercent = Math.round(
            (1 - priceData.calculated_amount / priceData.original_amount) * 100
          )
        }

        bestPriceData = {
          calculated_amount: priceData.calculated_amount,
          original_amount: priceData.original_amount,
          currency_code: priceData.currency_code,
          formatted_calculated_price: formattedCalculatedPrice,
          formatted_original_price: formattedOriginalPrice,
          discount_percent: discountPercent,
          has_discount: discountPercent !== null && discountPercent > 0,
        }
      }
    }
    // Fallback a prices si no hay calculated_price
    else if (variant.prices && variant.prices.length > 0) {
      const price = variant.prices[0]
      const priceAmount = price.amount / 100

      if (priceAmount < lowestCalculatedPrice) {
        lowestCalculatedPrice = priceAmount

        const formattedPrice =
          price.currency_code === "eur"
            ? `€${priceAmount.toFixed(2)}`
            : `${priceAmount.toFixed(2)} ${price.currency_code.toUpperCase()}`

        bestPriceData = {
          calculated_amount: priceAmount,
          original_amount: priceAmount,
          currency_code: price.currency_code,
          formatted_calculated_price: formattedPrice,
          formatted_original_price: formattedPrice,
          discount_percent: null,
          has_discount: false,
        }
      }
    }
  }

  return bestPriceData
}

// Función para extraer el precio numérico de un hit (busca el menor precio entre todas las variantes)
const getHitPrice = (hit: Hit): number => {
  // Validar que hit existe y tiene la estructura esperada
  if (!hit || !hit.variants || hit.variants.length === 0) return 0

  let lowestPrice = Infinity

  // Revisar todas las variantes para encontrar el menor precio
  for (const variant of hit.variants) {
    if (!variant) continue

    // Priorizar calculated_price si existe
    if (variant.calculated_price) {
      const price = variant.calculated_price.calculated_amount
      if (price < lowestPrice) {
        lowestPrice = price
      }
    }
    // Fallback a prices
    else if (variant.prices && variant.prices.length > 0) {
      const price = variant.prices[0].amount / 100
      if (price < lowestPrice) {
        lowestPrice = price
      }
    }
  }

  return lowestPrice === Infinity ? 0 : lowestPrice
}

// Función para ordenar los hits según el criterio seleccionado
const sortHits = (hits: Hit[], sortBy: string): Hit[] => {
  if (sortBy === "relevance") {
    return hits // Mantener orden original de Algolia
  }

  // Filtrar hits válidos antes de ordenar
  const validHits = hits.filter((hit) => hit && typeof hit === "object")

  const sortedHits = [...validHits].sort((a, b) => {
    const priceA = getHitPrice(a)
    const priceB = getHitPrice(b)

    if (sortBy === "price_asc") {
      return priceA - priceB
    } else if (sortBy === "price_desc") {
      return priceB - priceA
    }

    return 0
  })

  return sortedHits
}

// Componente para mostrar el precio (ahora muestra el menor precio entre todas las variantes)
const SearchHitPrice = ({ hit }: { hit: Hit }) => {
  const priceData = extractPriceFromHit(hit)

  if (!priceData) return null

  return (
    <div className="flex items-end gap-x-3 mt-2 flex-wrap">
      {priceData.has_discount ? (
        <>
          <div className="text-2xl font-dmSans font-bold text-gray-900">
            {priceData.formatted_calculated_price}
          </div>
          <div className="text-2xl text-gray-500 line-through">
            {priceData.formatted_original_price}
          </div>
        </>
      ) : (
        <div className="text-2xl flex gap-2 font-bold text-gray-900">
          {priceData.formatted_calculated_price}
        </div>
      )}

      {priceData.discount_percent !== null &&
        priceData.discount_percent > 0 && (
          <div className="font-dmSans bg-mysRed-100 text-white text-base font-semibold px-2 py-1 rounded-3xl">
            -{priceData.discount_percent}%
          </div>
        )}
    </div>
  )
}

const SearchPageHit = ({ hit }: { hit: Hit }) => {
  const hasValidThumbnail =
    hit.thumbnail && hit.thumbnail !== null && hit.thumbnail !== ""

  return (
    <Link href={`/producto/${hit.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="font-dmSans bg-white overflow-hidden rounded-b-lg rounded-t-lg border-gray-300 border-[0.5px] shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div className="relative overflow-hidden">
          <div className="w-full aspect-square relative bg-gray-50 overflow-hidden">
            {hasValidThumbnail ? (
              <Image
                src={hit.thumbnail}
                alt={hit.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="p-4 border-t ">
            <Text
              className="text-gray-900 font-dmSans font-medium text-base leading-tight"
              data-testid="product-title"
            >
              {hit.title}
            </Text>

            <ProductAverageReview productId={hit.id} />

            <SearchHitPrice hit={hit} />
          </div>
        </div>
      </div>
    </Link>
  )
}

// Componente simple para ordenamiento por precio con botones como en la imagen
const SimplePriceSortFilter = ({
  currentSort,
  onSortChange,
}: {
  currentSort: string
  onSortChange: (sort: string) => void
}) => {
  const sortOptions = [
    { value: "relevance", label: "Últimas novedades" },
    { value: "price_asc", label: "Precio más bajo" },
    { value: "price_desc", label: "Precio más alto" },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Filtrar por</h3>
      <div className="space-y-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
              currentSort === option.value
                ? "bg-mysGreen-100 text-black font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Componente para el filtro de precios
const PriceFilter = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Precio</h3>
      <RangeInput
        attribute="price_range"
        classNames={{
          root: "space-y-3",
          form: "flex gap-2 items-center",
          input:
            "flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-mysGreen-100 focus:border-transparent",
          separator: "text-gray-500 text-sm",
          submit:
            "px-3 py-2 bg-mysGreen-100 text-white text-sm rounded-md hover:bg-mysGreen-200 transition-colors",
        }}
        translations={{
          submit: "Aplicar",
          separator: "a",
        }}
      />
    </div>
  )
}

// Componente para filtros activos
const ActiveFilters = () => {
  return (
    <div className="space-y-4">
      <CurrentRefinements
        classNames={{
          root: "",
          list: "flex flex-wrap gap-2",
          item: "bg-mysGreen-100 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2",
          label: "font-medium",
          category: "",
          categoryLabel: "",
          delete: "hover:bg-mysGreen-200 rounded-full p-1",
        }}
        transformItems={(items) => {
          return items.map((item) => ({
            ...item,
            refinements: item.refinements.map((refinement) => ({
              ...refinement,
              label:
                typeof refinement.label === "string"
                  ? refinement.label
                  : String(refinement.label),
            })),
          }))
        }}
      />
    </div>
  )
}

// Componente para la sidebar de filtros (mobile)
const MobileFilters = ({
  isOpen,
  onClose,
  currentSort,
  onSortChange,
}: {
  isOpen: boolean
  onClose: () => void
  currentSort: string
  onSortChange: (sort: string) => void
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto">
          <ActiveFilters />
          <SimplePriceSortFilter
            currentSort={currentSort}
            onSortChange={onSortChange}
          />
          <PriceFilterWrapperTwo />
        </div>
      </div>
    </div>
  )
}

const NoResultsMessage = ({ query }: { query: string }) => (
  <div className="text-center py-16 col-span-full">
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
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [currentSort, setCurrentSort] = useState("relevance")
  // 🔥 NUEVO: Obtener filtros de precio de la URL
  const paramMin = searchParams.get("minPrice")
  const paramMax = searchParams.get("maxPrice")
  const urlMinPrice = paramMin ? Number.parseInt(paramMin, 10) : undefined
  const urlMaxPrice = paramMax ? Number.parseInt(paramMax, 10) : undefined

  // 🔥 NUEVO: Función para filtrar hits por precio
  const filterHitsByPrice = (hits: Hit[]): Hit[] => {
    // Si no hay filtros de precio, devolver todos
    if (!urlMinPrice && !urlMaxPrice) return hits

    const filtered = hits.filter((hit) => {
      const lowestPrice = getHitPrice(hit)
      if (lowestPrice === 0) return false

      const matchesMin = !urlMinPrice || lowestPrice >= urlMinPrice
      const matchesMax = !urlMaxPrice || lowestPrice <= urlMaxPrice
      const included = matchesMin && matchesMax

      console.log("🔍 Filtro:", {
        title: hit.title.substring(0, 20),
        price: lowestPrice,
        min: urlMinPrice,
        max: urlMaxPrice,
        included,
      })

      return included
    })

    console.log(`💰 Filtrado: ${hits.length} → ${filtered.length}`)
    return filtered
  }

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
    <div className="max-w-screen-large mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        key={`search-${query}`}
      >
        <URLSync />
        <Configure hitsPerPage={20} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Resultados para: "{query}"
          </h1>

          <div className="w-full max-w-md">
            <SearchBox
              placeholder="Buscar productos..."
              classNames={{
                root: "relative",
                form: "relative",
                input:
                  "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mysGreen-100 focus:border-transparent focus:outline-none [&:focus]:shadow-none",
                submit: "absolute left-3 top-1/2 transform -translate-y-1/2",
                submitIcon: "w-5 h-5 text-gray-400",
                reset: "hidden",
              }}
            />
          </div>
        </div>

        <div className="flex gap-8 flex-col lg:flex-row">
          <div className="hidden lg:block flex-shrink-0 w-64">
            <div className="sticky top-4 space-y-6">
              <ActiveFilters />
              <SimplePriceSortFilter
                currentSort={currentSort}
                onSortChange={setCurrentSort}
              />
              <PriceFilterWrapperTwo />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <Stats
                classNames={{
                  root: "text-sm text-gray-600",
                }}
              />

              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-gray-400"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
            </div>

            <div className="mb-8">
              <Hits
                hitComponent={SearchPageHit}
                transformItems={(items) => {
                  console.log("🔍 HITS RECIBIDOS:", {
                    total: items.length,
                    currentSort,
                    primer: items[0]?.title?.substring(0, 30) + "...",
                    itemsValidos: items.filter(
                      (item) => item && typeof item === "object"
                    ).length,
                  })

                  // 1. Filtrar por precio primero
                  const filteredByPrice = filterHitsByPrice(items)

                  // 2. Luego ordenar los hits filtrados
                  const sortedItems = sortHits(filteredByPrice, currentSort)

                  console.log("🔍 HITS FINALES:", {
                    total: sortedItems.length,
                    primer:
                      sortedItems[0]?.title?.substring(0, 30) + "..." ||
                      "ninguno",
                    primerPrecio: sortedItems[0]
                      ? getHitPrice(sortedItems[0])
                      : "N/A",
                  })

                  return sortedItems
                }}
                classNames={{
                  root: "",
                  list: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6",
                  item: "",
                }}
                emptyComponent={() => <NoResultsMessage query={query} />}
              />
            </div>

            <div className="flex justify-center">
              <Pagination
                classNames={{
                  root: "flex items-center gap-2",
                  list: "flex items-center gap-1",
                  item: "px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors",
                  selectedItem:
                    "px-3 py-2 text-sm font-medium bg-mysGreen-100 text-white rounded-md",
                  disabledItem:
                    "px-3 py-2 text-sm font-medium text-gray-300 cursor-not-allowed",
                  link: "block",
                }}
              />
            </div>
          </div>
        </div>

        <MobileFilters
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          currentSort={currentSort}
          onSortChange={setCurrentSort}
        />
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
