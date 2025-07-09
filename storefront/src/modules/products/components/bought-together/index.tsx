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
      fields:
        "id,title,handle,thumbnail,*variants,prices,images,*options,*options.values",
    })
    relatedProducts = products
  } catch (error) {
    console.error("Error fetching bought-together products:", error)
  }

  if (relatedProducts.length === 0) {
    return null
  }

  // — Precio de descuento opcional
  const productDiscounts: Record<string, number> = {};
  if(product.metadata){
    for (const key in product.metadata) {
      if (key.startsWith("bought_together_discount_")){
        const relatedProductsId = key.replace("bought_together_discount_", "");
        const discountValueRow = product.metadata[key];

        if (typeof discountValueRow === "string" && discountValueRow !== "null") {
          const parsedDiscount = parseFloat(discountValueRow);
          if (!isNaN(parsedDiscount)){
            productDiscounts[relatedProductsId] = parsedDiscount;
          }
        } else if (typeof discountValueRow === "number"){
          productDiscounts[relatedProductsId] = discountValueRow;
        }
      }
    }
  }

  return (
    <div className="w-full">
      <Heading
        level="h2"
        className="pb-4 pt-2 text-xl sm:text-2xl font-archivoBlack"
      >
        COMBINA CON
      </Heading>

      <Suspense
        fallback={
          <BoughtTogetherFallback
            products={relatedProducts}
            region={region}
            productDiscounts={productDiscounts}
          />
        }
      >
        <BoughtTogetherClient
          products={relatedProducts}
          region={region}
          productDiscounts={productDiscounts}
        />
      </Suspense>
    </div>
  )
}
