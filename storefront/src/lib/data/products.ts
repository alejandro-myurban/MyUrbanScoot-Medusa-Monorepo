import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
// Removed getAuthHeaders import to avoid server-only issues
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { sortProducts } from "@lib/util/sort-products"
import { StoreProductListResponse } from "@medusajs/types"

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to get customer info for debugging
const getCustomerForDebug = async () => {
  try {
    const { getCustomer } = await import("./customer")
    const customer = await getCustomer()
    console.log("🔍 PRICING DEBUG - Customer info:", {
      isLoggedIn: !!customer,
      customerId: customer?.id,
      customerEmail: customer?.email,
    })
    return customer
  } catch (error) {
    console.log("🔍 PRICING DEBUG - Customer fetch error:", error.message)
    return null
  }
}

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

  // Agregar delay antes de la request
  await delay(100) // 100ms de delay

  // Debug customer context for pricing
  const customer = await getCustomerForDebug()
  
  // Use safe auth headers utility
  const { getAuthHeadersSafe } = await import("./auth-utils")
  const authHeaders = await getAuthHeadersSafe()
  
  console.log('🔍 PRICING DEBUG - getProductsById called with:', {
    ids: ids.slice(0, 3), // Log first 3 IDs only
    regionId,
    countryCode,
    customerDetected: !!customer,
    customerId: customer?.id,
    hasAuthHeaders: !!Object.keys(authHeaders).length,
    authHeaderKeys: Object.keys(authHeaders),
    willPassCustomerId: !!customer?.id,
    // Debug: Log the actual auth headers (without sensitive data)
    authHeadersPresent: Object.keys(authHeaders).length > 0 ? 'Bearer token present' : 'No auth',
  })
  
  return sdk.store.product
    .list(
      {
        id: ids,
        region_id: regionId,
        fields: `*variants.calculated_price,+variants.inventory_quantity,+tags,+metadata${translationsField}`,
      },
      { 
        next: { tags: ["products"] },
        ...authHeaders
      }
    )
    .then(({ products }) => {
      console.log('🔍 PRICING DEBUG - getProductsById response:', {
        productCount: products.length,
        firstProductPricing: products[0]?.variants?.[0]?.calculated_price ? {
          calculatedAmount: products[0].variants[0].calculated_price.calculated_amount,
          originalAmount: products[0].variants[0].calculated_price.original_amount,
          currencyCode: products[0].variants[0].calculated_price.currency_code,
          priceListType: products[0].variants[0].calculated_price.calculated_price?.price_list_type,
          // Debug more detailed pricing info
          fullCalculatedPrice: products[0].variants[0].calculated_price,
        } : 'No pricing data',
        customerId: customer?.id || 'No customer',
        // Log first product details for debugging
        firstProduct: products[0] ? {
          id: products[0].id,
          title: products[0].title,
          variantCount: products[0].variants?.length
        } : null,
      })

      return products.map((product) => ({
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
    })
})

export const getProductByHandle = cache(async function (
  handle: string,
  regionId: string,
  countryCode?: string
) {
  const translationsField = countryCode
    ? `,+translations.${countryCode},+options.translations.${countryCode},+options.values.translations.${countryCode}`
    : ""

  // Agregar delay antes de la request
  await delay(100) // 100ms de delay

  // Debug customer context for pricing
  const customer = await getCustomerForDebug()
  
  console.log('🔍 PRICING DEBUG - getProductByHandle called with:', {
    handle,
    regionId,
    countryCode,
    customerDetected: !!customer,
    customerId: customer?.id,
  })

  // Use safe auth headers utility
  const { getAuthHeadersSafe } = await import("./auth-utils")
  const authHeaders = await getAuthHeadersSafe()
  
  return sdk.store.product
    .list(
      {
        handle,
        region_id: regionId,
        fields: `*variants.calculated_price,+variants.inventory_quantity,+categories.*,+tags,+metadata${translationsField}`,
      },
      { 
        next: { tags: ["products"] },
        ...authHeaders
      }
    )
    .then(({ products }) => {
      const product = products[0]
      
      console.log('🔍 PRICING DEBUG - getProductByHandle response:', {
        productFound: !!product,
        productId: product?.id,
        variantCount: product?.variants?.length || 0,
        firstVariantPricing: product?.variants?.[0]?.calculated_price ? {
          calculatedAmount: product.variants[0].calculated_price.calculated_amount,
          originalAmount: product.variants[0].calculated_price.original_amount,
          currencyCode: product.variants[0].calculated_price.currency_code,
          priceListType: product.variants[0].calculated_price.calculated_price?.price_list_type,
        } : 'No pricing data',
        customerId: customer?.id || 'No customer',
      })
      
      if (product && countryCode) {
        return {
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
        }
      }
      return product
    })
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

  // Debug customer context for pricing
  const customer = await getCustomerForDebug()
  
  console.log('🔍 PRICING DEBUG - getProductsList called with:', {
    pageParam,
    limit,
    offset,
    regionId: region.id,
    countryCode,
    customerDetected: !!customer,
    customerId: customer?.id,
  })
  
  // Use safe auth headers utility
  const { getAuthHeadersSafe } = await import("./auth-utils")
  const authHeaders = await getAuthHeadersSafe()
  
  return sdk.store.product
    .list(
      {
        limit,
        offset,
        region_id: region.id,
        fields: "*variants.calculated_price,+metadata,*categories",
        ...cleanQueryParams,
      },
      { 
        next: { tags: ["products"] },
        ...authHeaders
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      console.log('🔍 PRICING DEBUG - getProductsList response:', {
        productCount: products.length,
        totalCount: count,
        firstProductPricing: products[0]?.variants?.[0]?.calculated_price ? {
          calculatedAmount: products[0].variants[0].calculated_price.calculated_amount,
          originalAmount: products[0].variants[0].calculated_price.original_amount,
          currencyCode: products[0].variants[0].calculated_price.currency_code,
          priceListType: products[0].variants[0].calculated_price.calculated_price?.price_list_type,
        } : 'No pricing data',
        customerId: customer?.id || 'No customer',
      })

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
