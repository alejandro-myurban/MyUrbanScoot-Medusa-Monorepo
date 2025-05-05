// app/components/bought-together/BoughtTogetherFallback.tsx

import Thumbnail from "../thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPrice from "../product-preview/price"
import { getProductPrice } from "@lib/util/get-product-price"
import { Button, Text } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"

interface FallbackProps {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  discount?: string | number
}

export default function BoughtTogetherFallback({
  products,
  region,
  discount,
}: FallbackProps) {
  // Collapsed initial state: all unchecked, not adding
  const isAdding = false

  return (
    <div className="space-y-4">
      {products.map((p) => {
        const variant = p.variants?.[0]
        if (!variant) return null

        // Compute price with same logic
        const { cheapestPrice } = getProductPrice({ product: p }) ?? {}
        if (!cheapestPrice) return null

        let displayPrice = cheapestPrice
        if (discount) {
          const discountAmount =
            typeof discount === "string" ? parseFloat(discount) : discount
          if (!isNaN(discountAmount) && discountAmount > 0) {
            const originalPriceNumber =
              cheapestPrice.calculated_price_number ||
              parseFloat(
                (cheapestPrice.calculated_price || "")
                  .toString()
                  .replace(/[^0-9.,]+/g, "")
                  .replace(",", ".")
              )
            const discountedPriceNumber =
              originalPriceNumber * (1 - discountAmount / 100)
            const symbol =
              typeof cheapestPrice.calculated_price === "string"
                ? cheapestPrice.calculated_price.charAt(0)
                : ""
            const formatted = `${symbol}${discountedPriceNumber.toFixed(2)}`
            displayPrice = {
              ...cheapestPrice,
              calculated_price_number: discountedPriceNumber,
              calculated_price: formatted,
              original_price: cheapestPrice.calculated_price,
              price_type: "sale",
            }
          }
        }

        return (
          <div key={variant.id} className="flex items-center gap-x-4">
            <input
              type="checkbox"
              defaultChecked={false}
              disabled={isAdding}
            />
            <LocalizedClientLink
              href={`/products/${p.handle}`}
              className="flex items-center gap-x-4 group"
            >
              <Thumbnail
                thumbnail={p.thumbnail}
                images={p.images}
                size="full"
              />
              <div className="flex flex-col">
                <Text className="group-hover:underline">
                  {p.title}
                </Text>
                <PreviewPrice price={displayPrice} />
              </div>
            </LocalizedClientLink>
          </div>
        )
      })}

      <Button disabled={isAdding} variant="primary" className="w-full mt-4">
        Añadir seleccionados al carrito
      </Button>
    </div>
  )
}
