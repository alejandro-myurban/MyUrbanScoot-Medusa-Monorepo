// modules/store/templates/paginated-products.tsx

import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { StoreProduct } from "@medusajs/types"

export default async function PaginatedProducts({
  sortBy,
  page,
  categoryId,
  productsIds,
  countryCode,
  searchParams,
  allProducts, // ¡NUEVO! Recibimos todos los productos de la categoría
}: {
  sortBy?: SortOptions
  page: number
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  searchParams: { [key: string]: string | string[] | undefined }
  allProducts: StoreProduct[] // ¡NUEVO! Lista completa de productos
}) {
  const PRODUCT_LIMIT = 12

  // Extraemos y validamos minPrice y maxPrice de searchParams
  const extractParam = (
    param: string | string[] | undefined
  ): string | undefined => {
    return Array.isArray(param) ? param[0] : param
  }

  const paramMin = extractParam(searchParams.minPrice)
  const paramMax = extractParam(searchParams.maxPrice)

  // Convertimos a números solo si son válidos
  const minPrice =
    paramMin && !isNaN(Number(paramMin))
      ? Number.parseInt(paramMin, 10)
      : undefined
  const maxPrice =
    paramMax && !isNaN(Number(paramMax))
      ? Number.parseInt(paramMax, 10)
      : undefined

  // DEBUG: Vamos a ver qué está pasando
  console.log("🔍 DEBUG PaginatedProducts:")
  console.log("- searchParams:", searchParams)
  console.log("- paramMin:", paramMin, "paramMax:", paramMax)
  console.log("- minPrice:", minPrice, "maxPrice:", maxPrice)
  console.log("- Total productos recibidos:", allProducts.length)

  const region = await getRegion(countryCode)
  if (!region) {
    return (
      <div className="text-center py-8">
        <p>Región no encontrada</p>
      </div>
    )
  }

  // 1. FILTRAR POR PRECIO (si hay filtros aplicados)
  let filteredProducts = allProducts

  if (minPrice !== undefined || maxPrice !== undefined) {
    console.log("Aplicando filtro de precio:", { minPrice, maxPrice })

    filteredProducts = allProducts.filter((product) => {
      // Obtenemos todos los precios válidos de las variantes
      const prices = product.variants
        ?.map((variant) => {
          const price = variant.calculated_price?.calculated_amount
          console.log(
            `Producto ${product.title}, Variante ${variant.id}, Precio:`,
            price
          )
          return price
        })
        .filter(
          (price): price is number => typeof price === "number" && !isNaN(price)
        )

      if (prices?.length === 0) {
        console.log(`Producto ${product.title} no tiene precios válidos`)
        return false
      }

      // Calculamos el precio mínimo del producto
      //@ts-ignore
      const minProductPrice = Math.min(...prices)
      console.log(`Producto ${product.title}, Precio mínimo:`, minProductPrice)

      // Verificamos si el precio mínimo está en el rango
      const isAboveMin = minPrice === undefined || minProductPrice >= minPrice
      const isBelowMax = maxPrice === undefined || minProductPrice <= maxPrice

      const inRange = isAboveMin && isBelowMax
      console.log(`Producto ${product.title}, En rango:`, inRange, {
        isAboveMin,
        isBelowMax,
      })

      return inRange
    })
  }

  console.log("- Productos después del filtro:", filteredProducts.length)

  // 2. APLICAR ORDENAMIENTO
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "created_at":
        return (
          //@ts-ignore
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      case "price_asc":
        const priceA = a.variants?.[0]?.calculated_price?.calculated_amount || 0
        const priceB = b.variants?.[0]?.calculated_price?.calculated_amount || 0
        return priceA - priceB
      case "price_desc":
        const priceA2 =
          a.variants?.[0]?.calculated_price?.calculated_amount || 0
        const priceB2 =
          b.variants?.[0]?.calculated_price?.calculated_amount || 0
        return priceB2 - priceA2
      //@ts-ignore
      case "title_asc":
        return a.title.localeCompare(b.title)
      //@ts-ignore
      case "title_desc":
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  // 3. APLICAR PAGINACIÓN
  const totalCount = sortedProducts.length
  const totalPages = Math.ceil(totalCount / PRODUCT_LIMIT)
  const startIndex = (page - 1) * PRODUCT_LIMIT
  const endIndex = startIndex + PRODUCT_LIMIT
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  // Si no hay productos después del filtrado, mostrar mensaje
  if (sortedProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No se encontraron productos
          {(minPrice || maxPrice) && " en el rango de precio seleccionado"}
        </p>
      </div>
    )
  }

  return (
    <>
      <ul
        className="grid grid-cols-1 xsmall:grid-cols-2 msmall:grid-cols-2  w-full -z-20 small:grid-cols-2 medium:grid-cols-3 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {paginatedProducts.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
