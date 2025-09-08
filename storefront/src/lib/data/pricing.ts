import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getCustomer } from "./customer"

export const calculatePrices = cache(async function (
  variants: (HttpTypes.StoreProductVariant & {
    product?: HttpTypes.StoreProduct
  })[]
) {
  // Get customer for pricing context
  const customer = await getCustomer()
  
  const { variants: pricedVariants } = await sdk.store.product.calculatePrices(
    {
      id: variants.map((v) => v.id),
    },
    {
      // Include customer context for price list overrides
      ...(customer?.id && { customer_id: customer.id }),
    }
  )

  return pricedVariants
})