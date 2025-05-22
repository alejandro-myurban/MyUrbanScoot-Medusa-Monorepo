import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { sortProducts } from "@lib/util/sort-products"
import { StoreProductListResponse } from "@medusajs/types"

async function getProductTranslations(
  productId: string,
  regionId: string,
  countryCode: string,
  maxRetries: number = 2
) {
  const translationsField = `,+translations.${countryCode},+options.translations.${countryCode},+options.values.translations.${countryCode}`

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Delay progresivo
      if (attempt > 1) {
        const delay = Math.random() * 2000 + attempt * 1000 // Random delay + progressive
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      const { products } = await sdk.store.product.list(
        {
          id: [productId],
          region_id: regionId,
          fields: `id${translationsField}`,
        },
        { next: { tags: ["translations"] } }
      )

      const translatedProduct = products[0]
      if (!translatedProduct) {
        throw new Error(`Product ${productId} not found for translations`)
      }

      return {
        options: translatedProduct.options?.map((option) => ({
          ...option,
          translations: option.translations?.[countryCode],
          values: option.values?.map((value) => ({
            ...value,
            translations: value.translations?.[countryCode],
          })),
        })),
        translations: translatedProduct.translations?.[countryCode],
      }
    } catch (error: any) {
      const isRateLimit =
        error.response?.status === 429 ||
        error.status === 429 ||
        error.message?.includes("429")

      if (isRateLimit && attempt < maxRetries) {
        console.warn(
          `Rate limit hit for ${productId}, attempt ${attempt}/${maxRetries}`
        )
        continue // Reintentar
      }

      throw error // Falló definitivamente
    }
  }
}

export const getProductsByTagName = cache(async function ({
  tagName,
}: {
  tagName: string
}): Promise<StoreProductListResponse> {
  const res = await sdk.client.fetch(
    `/store/product-tags-custom?value=${encodeURIComponent(tagName)}`
  )
  if (!res) {
    // quizá lanzar un error o devolver { products: [], count: 0 }
    throw new Error("No se recibió respuesta del endpoint")
  }
  // casteamos al tipo oficial
  return res as StoreProductListResponse
})

export const getProductsById = cache(async function ({
  ids,
  regionId,
  countryCode,
}: {
  ids: string[]
  regionId: string
  countryCode?: string
}) {
  const translationsField = countryCode
    ? `,+translations.${countryCode},+options.translations.${countryCode},+options.values.translations.${countryCode}`
    : ""

  return sdk.store.product
    .list(
      {
        id: ids,
        region_id: regionId,
        fields: `*variants.calculated_price,+variants.inventory_quantity,+tags,+metadata${translationsField}`,
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products }) =>
      products.map((product) => ({
        ...product,
        // assign the translations for the desired language directly to the product
        // so that the country code is not needed anymore
        options: product.options?.map((option) => ({
          ...option,
          translations: countryCode
            ? //@ts-ignore
              option.translations?.[countryCode]
            : undefined,
          values: option.values?.map((value) => ({
            ...value,
            translations: countryCode
              ? //@ts-ignore
                value.translations?.[countryCode]
              : undefined,
          })),
        })),
        translations: countryCode
          ? product.translations?.[countryCode]
          : undefined,
      }))
    )
})

export const getProductByHandle = cache(async function (
  handle: string,
  regionId: string,
  countryCode?: string
) {
  // Siempre obtener el producto básico primero
  const { products } = await sdk.store.product.list(
    {
      handle,
      region_id: regionId,
      fields: `*variants.calculated_price,+variants.inventory_quantity,+tags,+metadata`,
    },
    { next: { tags: ["products"] } }
  )

  const product = products[0]
  if (!product) return undefined

  // Si no se necesitan traducciones, retornar inmediatamente
  if (!countryCode) return product

  // Intentar obtener traducciones, pero con manejo de errores robusto
  try {
    const translatedProduct = await getProductTranslations(
      product.id,
      regionId,
      countryCode
    )

    return {
      ...product,
      ...translatedProduct,
    }
  } catch (error) {
    console.warn(
      `Translations failed for ${handle}, serving without translations:`,
      error.message
    )
    return product // Retornar sin traducciones
  }
})

export const getProductsList = cache(async function ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12
  const validPageParam = Math.max(pageParam, 1)
  const offset = (validPageParam - 1) * limit
  const region = await getRegion(countryCode)
  const { tags, ...cleanQueryParams } = queryParams || ({} as any)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
  return sdk.store.product
    .list(
      {
        limit,
        offset,
        region_id: region.id,
        fields: "*variants.calculated_price",
        ...cleanQueryParams,
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
})

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const getProductsListWithSort = cache(async function ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await getProductsList({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
})
