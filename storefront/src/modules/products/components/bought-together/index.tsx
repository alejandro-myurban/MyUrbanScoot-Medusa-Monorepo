// app/components/bought-together/BoughtTogether.tsx
import { Heading } from "@medusajs/ui"
import BoughtTogetherClient from "./bt-client"
import { sdk } from "@lib/config"
import type { HttpTypes } from "@medusajs/types"
import { Suspense } from "react"
import BoughtTogetherFallback from "./bt-fallback"

interface BoughtTogetherProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default async function BoughtTogether({
  product,
  region,
}: BoughtTogetherProps) {
  // — Extraemos los IDs desde metadata
  const metaValue = product.metadata?.bought_together
  let ids: string[] = []

  if (typeof metaValue === "string") {
    try {
      ids = JSON.parse(metaValue)
    } catch {
      ids = [metaValue]
    }
  } else if (Array.isArray(metaValue)) {
    ids = metaValue
  }

  if (ids.length === 0) {
    return null
  }

  // — Traemos los productos relacionados
  let relatedProducts: HttpTypes.StoreProduct[] = []
  try {
    const { products } = await sdk.store.product.list({
      id: ids,
      region_id: region.id, 
      fields: "id,title,handle,thumbnail,*variants,prices,images",
    })
    relatedProducts = products
  } catch (error) {
    console.error("Error fetching bought-together products:", error)
  }

  if (relatedProducts.length === 0) {
    return null
  }

  // — Precio de descuento opcional
  const disc = product.metadata?.bought_together_discount
  const discountValue =
    typeof disc === "string" || typeof disc === "number" ? disc : undefined

  return (
    <div className="w-full">
    <Heading level="h2" className="mb-4">
      Comprados Juntos
    </Heading>

    <Suspense fallback={
      <BoughtTogetherFallback
        products={relatedProducts} 
        region={region} 
        discount={discountValue}
      />
    }>
      <BoughtTogetherClient
        products={relatedProducts}
        region={region}
        discount={discountValue}
      />
    </Suspense>
  </div>
  )
}
