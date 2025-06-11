"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { useInstantSearch } from "react-instantsearch"
import { StoreProduct } from "@medusajs/types"
import { PriceRangeFilter } from "@modules/spare-parts/components/price-filter"

// Definir el tipo Hit basado en tu código
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
      original_amount: number
      currency_code: string
    }
    prices?: Array<{
      amount: number
      currency_code: string
      id: string
    }>
  }>
}

// Función optimizada para convertir hits a productos (solo los campos necesarios para el filtro)
const convertHitsToProducts = (hits: Hit[]): StoreProduct[] => {
  return hits.map((hit) => ({
    id: hit.id,
    title: hit.title,
    handle: hit.handle,
    subtitle: null,
    thumbnail: hit.thumbnail || "",
    origin_country: null,
    external_id: null,
    // Solo mapear las variantes con los datos de precio que necesita el filtro
    variants:
      hit.variants?.map((variant) => ({
        id: variant.id,
        calculated_price: variant.calculated_price
          ? {
              calculated_amount: variant.calculated_price.calculated_amount,
              original_amount: variant.calculated_price.original_amount,
              currency_code: variant.calculated_price.currency_code,
            }
          : variant.prices?.[0]
          ? {
              // Fallback: si no hay calculated_price, usar el primer precio
              calculated_amount: variant.prices[0].amount / 100, // Convertir de centavos
              original_amount: variant.prices[0].amount / 100,
              currency_code: variant.prices[0].currency_code,
            }
          : undefined,
        // Campos mínimos requeridos por el tipo
        title: `Variante ${variant.id}`,
        inventory_quantity: 0,
        manage_inventory: false,
        allow_backorder: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        product_id: hit.id,
        sku: variant.id,
        barcode: null,
        ean: null,
        upc: null,
        variant_rank: 0,
        weight: null,
        length: null,
        height: null,
        width: null,
        hs_code: null,
        mid_code: null,
        material: null,
        metadata: null,
        options: [],
        prices: [], // Array vacío por ahora
        origin_country: null,
      })) || [],
    // Campos mínimos requeridos por StoreProduct
    status: "published" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    description: hit.description || "",
    is_giftcard: false,
    discountable: true,
    weight: null,
    length: null,
    height: null,
    width: null,
    hs_code: null,
    mid_code: null,
    material: null,
    collection_id: null,
    collection: null,
    type_id: null,
    type: null,
    tags: [],
    categories: [],
    images: [],
    options: [],
    profiles: [],
    metadata: null,
  })) as StoreProduct[]
}

export default function PriceFilterWrapperTwo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { results, status } = useInstantSearch()
  const hits = results?.hits || []
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const paramMin = searchParams.get("minPrice")
  const paramMax = searchParams.get("maxPrice")
  const urlMinPrice = paramMin ? Number.parseInt(paramMin, 10) : undefined
  const urlMaxPrice = paramMax ? Number.parseInt(paramMax, 10) : undefined

  // 🔧 CORRECCIÓN 1: Quitar "idle" de la condición
  const allProducts = useMemo(() => {
    console.log("🚀 Procesando con:", {
      status,
      isClient,
      hitsLength: hits?.length || 0,
    })

    // Solo bloquear si está loading o no es cliente
    if (status === "loading" || !isClient || hits.length === 0) {
      console.log("⏸️ Retornando array vacío")
      return []
    }

    console.log("✅ Convirtiendo hits:", hits.length)
    const converted = convertHitsToProducts(hits as Hit[])
    console.log("📦 Productos convertidos:", converted.length)
    return converted
  }, [hits, status, isClient])

  // 🔥 NUEVO: Filtrar productos por precio usando los parámetros URL
  const products = useMemo(() => {
    if (allProducts.length === 0) return []

    // Si no hay filtros de precio, devolver todos
    if (!urlMinPrice && !urlMaxPrice) return allProducts

    return allProducts.filter((product) => {
      // Buscar el precio más bajo del producto
      let lowestPrice = Infinity
      
      product.variants?.forEach((variant) => {
        if (variant.calculated_price?.calculated_amount) {
          const price = variant.calculated_price.calculated_amount
          if (price < lowestPrice) {
            lowestPrice = price
          }
        }
      })

      // Si no encontramos precio válido, excluir el producto
      if (lowestPrice === Infinity) return false

      // Aplicar filtros
      const matchesMin = !urlMinPrice || lowestPrice >= urlMinPrice
      const matchesMax = !urlMaxPrice || lowestPrice <= urlMaxPrice

      console.log("🔍 Filtro de precio:", {
        productId: product.id,
        title: product.title.substring(0, 30),
        lowestPrice,
        urlMinPrice,
        urlMaxPrice,
        matchesMin,
        matchesMax,
        included: matchesMin && matchesMax,
      })

      return matchesMin && matchesMax
    })
  }, [allProducts, urlMinPrice, urlMaxPrice])

  const handlePriceChange = (newRange: number[]) => {
    if (!isClient) return

    const current = new URL(window.location.href)

    if (newRange[0] > 0) {
      current.searchParams.set("minPrice", String(newRange[0]))
    } else {
      current.searchParams.delete("minPrice")
    }

    if (newRange[1] < 999999) {
      current.searchParams.set("maxPrice", String(newRange[1]))
    } else {
      current.searchParams.delete("maxPrice")
    }

    router.push(current.toString())
  }

  // Loading state
  if (!isClient || status === "loading") {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Precio</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // 🔧 CORRECCIÓN 2: Lógica reorganizada CON filtro bonito
  if (allProducts.length === 0) {
    console.log("❌ NO HAY PRODUCTOS:", {
      status,
      isClient,
      hitsLength: hits?.length || 0,
    })

    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Precio</h3>
        <div className="text-sm text-gray-500">
          No hay productos disponibles para filtrar por precio
        </div>
      </div>
    )
  }

  // Verificar precios válidos en TODOS los productos (no solo los filtrados)
  const hasValidPrices = allProducts.some((p) =>
    p.variants?.some((v) => 
      v.calculated_price?.calculated_amount && 
      v.calculated_price.calculated_amount > 0
    )
  )

  if (!hasValidPrices) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Precio</h3>
        <div className="text-sm text-gray-500">
          Los productos no tienen información de precios válidos
        </div>
      </div>
    )
  }

  console.log("📊 Productos finales:", {
    total: allProducts.length,
    filtrados: products.length,
    urlMinPrice,
    urlMaxPrice,
  })

  // 🎨 Todo bien, mostrar el filtro BONITO con TODOS los productos para calcular rangos
  return (
    <PriceRangeFilter
      products={allProducts} // Pasamos TODOS para que calcule rangos correctos
      initialMin={urlMinPrice}
      initialMax={urlMaxPrice}
      onPriceChange={handlePriceChange}
    />
  )
}