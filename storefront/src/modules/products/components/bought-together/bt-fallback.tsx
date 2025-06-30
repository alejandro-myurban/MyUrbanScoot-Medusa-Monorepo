// app/components/bought-together/BoughtTogetherFallback.tsx
import Thumbnail from "../thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPrice from "../product-preview/price"
import { getProductPrice } from "@lib/util/get-product-price"
import { Button, Text } from "@medusajs/ui"
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
        let discountPercent: number | null = null

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
            discountPercent = Math.round((1 - discountedPriceNumber / originalPriceNumber) * 100)
          }
        }

        // Si hay descuento natural del producto
        if (
          !discountPercent &&
          typeof cheapestPrice?.original_price_number === "number" &&
          typeof cheapestPrice.calculated_price_number === "number" &&
          cheapestPrice.original_price_number > cheapestPrice.calculated_price_number
        ) {
          const orig = cheapestPrice.original_price_number
          const calc = cheapestPrice.calculated_price_number
          discountPercent = Math.round((1 - calc / orig) * 100)
        }

        return (
          <div
            key={p.id}
            className="font-dmSans bg-white overflow-hidden rounded-xl border-2 border-gray-300 transition-all duration-200 opacity-75"
          >
            {/* Layout desktop */}
            <div className="hidden md:flex items-center gap-4 p-4">
              {/* Imagen cuadrada */}
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                <Thumbnail
                  thumbnail={p.thumbnail}
                  images={p.images}
                  size="full"
                  className="!p-0 !bg-transparent !rounded-none w-full h-full object-cover opacity-50"
                />
              </div>

              {/* Contenido desktop */}
              <div className="flex-1 min-w-0">
                {/* Título */}
                <LocalizedClientLink
                  href={`/producto/${p.handle}`}
                  className="block group mb-1 pointer-events-none"
                >
                  <Text className="text-gray-900 font-bold text-sm leading-tight uppercase opacity-50">
                    {p.title}
                  </Text>
                </LocalizedClientLink>

                {/* Opciones con spinners */}
                {p.options && p.options.length > 0 && p.id && (
                  <div className="space-y-1 mb-2">
                    {p.options.map((option) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <Text className="text-gray-500 text-xs opacity-50">
                          {option.title}:
                        </Text>
                        <div className="flex gap-1">
                          {option.values?.map((value, idx) => (
                            <button
                              key={value.id}
                              disabled={true}
                              type="button"
                              className={`px-2 py-1 text-xs border rounded transition-colors flex items-center justify-center min-w-[40px] h-[24px] ${
                                idx === 0
                                  ? "bg-gray-900 text-white border-gray-900 opacity-50"
                                  : "border-gray-300 bg-white opacity-50"
                              }`}
                            >
                              <Spinner className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Precio a la derecha desktop */}
              <div className="flex flex-col items-end text-right">
                {displayPrice && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-gray-900 opacity-50">
                        <PreviewPrice price={displayPrice} />
                      </div>
                      {/* Badge de descuento */}
                      {discountPercent !== null && discountPercent > 0 && (
                        <div className="bg-gray-300 text-gray-500 text-xs font-bold px-1.5 py-0.5 rounded">
                          -{discountPercent}%
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Layout mobile */}
            <div className="md:hidden p-3">
              <div className="flex gap-3">
                {/* Imagen mobile */}
                <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  <Thumbnail
                    thumbnail={p.thumbnail}
                    images={p.images}
                    size="full"
                    className="!p-0 !bg-transparent !rounded-none w-full h-full object-cover opacity-50"
                  />
                </div>

                {/* Contenido mobile con título arriba a la derecha */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    {/* Título mobile */}
                    <LocalizedClientLink
                      href={`/producto/${p.handle}`}
                      className="block group flex-1 mr-2 pointer-events-none"
                    >
                      <Text className="text-gray-900 font-bold text-xs leading-tight uppercase opacity-50">
                        {p.title}
                      </Text>
                    </LocalizedClientLink>

                    {/* Precio arriba a la derecha mobile */}
                    {displayPrice && (
                      <div className="flex items-center gap-1">
                        <div className="text-sm font-bold text-gray-900 opacity-50">
                          <PreviewPrice price={displayPrice} />
                        </div>
                        {/* Badge de descuento mobile */}
                        {discountPercent !== null && discountPercent > 0 && (
                          <div className="bg-gray-300 text-gray-500 text-xs font-bold px-1 py-0.5 rounded">
                            -{discountPercent}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Opciones mobile con spinners */}
                  {p.options && p.options.length > 0 && p.id && (
                    <div className="space-y-1">
                      {p.options.map((option) => (
                        <div key={option.id}>
                          <Text className="text-gray-500 text-xs mb-1 block opacity-50">
                            {option.title}:
                          </Text>
                          <div className="flex gap-1 flex-wrap">
                            {option.values?.map((value, idx) => (
                              <button
                                key={value.id}
                                disabled={true}
                                type="button"
                                className={`px-2 py-1 text-xs border rounded transition-colors flex items-center justify-center min-w-[40px] h-[24px] ${
                                  idx === 0
                                    ? "bg-gray-900 text-white border-gray-900 opacity-50"
                                    : "border-gray-300 bg-white opacity-50"
                                }`}
                              >
                                <Spinner className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

    </div>
  )
}