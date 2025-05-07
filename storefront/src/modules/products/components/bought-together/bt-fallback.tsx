// app/components/bought-together/BoughtTogetherFallback.tsx
import Thumbnail from "../thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPrice from "../product-preview/price"
import { getProductPrice } from "@lib/util/get-product-price"
import { Button, Text } from "@medusajs/ui"  // import Spinner
import type { HttpTypes } from "@medusajs/types"
import Spinner from "@modules/common/icons/spinner"

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
  // Collapsed initial state: all unchecked, show loading placeholder
  const isAdding = false

  return (
    <div className="space-y-6">
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

            let formattedDiscountedPrice: string
            if (
              typeof cheapestPrice.calculated_price === "string" &&
              cheapestPrice.calculated_price.includes("€")
            ) {
              formattedDiscountedPrice = `€${discountedPriceNumber.toFixed(2)}`
            } else if (
              typeof cheapestPrice.calculated_price === "string" &&
              cheapestPrice.calculated_price.includes("$")
            ) {
              formattedDiscountedPrice = `$${discountedPriceNumber.toFixed(2)}`
            } else {
              formattedDiscountedPrice = discountedPriceNumber.toFixed(2)
            }

            displayPrice = {
              ...cheapestPrice,
              calculated_price_number: discountedPriceNumber,
              calculated_price: formattedDiscountedPrice,
              original_price: cheapestPrice.calculated_price,
              price_type: "sale",
            }
          }
        }

        return (
          <div key={p.id} className="p-4 border rounded-lg">
            <div className="flex items-center gap-x-4 mb-3">
              <input
                type="checkbox"
                defaultChecked={false}
                disabled={isAdding}
                className="h-5 w-5"
              />
              <LocalizedClientLink
                href={`/products/${p.handle}`}
                className="flex items-center gap-x-4 group flex-1"
              >
                <Thumbnail
                  thumbnail={p.thumbnail}
                  images={p.images}
                  size="small"
                />
                <div className="flex flex-col">
                  <Text className="group-hover:underline font-medium">
                    {p.title}
                  </Text>
                  <PreviewPrice price={displayPrice} />
                </div>
              </LocalizedClientLink>
            </div>

            {/* Opciones del producto (versión estática para el fallback) */}
            {p.options && p.options.length > 0 && (
              <div className="pl-9 space-y-3">
                {p.options.map(option => (
                  <div key={option.id} className="space-y-2">
                    <Text size="small" className="text-gray-600">
                      {option.title}:
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {option.values?.map((value, idx) => (
                        <button
                          key={value.id}
                          className={`px-3 py-1 w-20 h-[30px] text-sm border rounded-md transition-colors flex items-center justify-center ${
                            idx === 0
                              ? 'bg-ui-button-inverted text-white border-gray-900'
                              : 'border-gray-300'
                          }`}
                          type="button"
                          disabled={true}
                        >
                          <Spinner /> 
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Button
        disabled={true}
        variant="primary"
        className="w-full mt-6 flex items-center justify-center"
      >
        <Spinner /> {/* spinner en botón principal */}
      </Button>
    </div>
  )
}
