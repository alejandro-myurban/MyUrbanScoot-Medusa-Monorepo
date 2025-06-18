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
    <div className="space-y-6">
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
            // Calcular porcentaje de descuento
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
            className="font-dmSans bg-white overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm opacity-75"
          >
            {/* Card con skeleton loading */}
            <div className="flex items-start gap-3 p-3">
              {/* Checkbox deshabilitado */}
              <input
                type="checkbox"
                defaultChecked={false}
                disabled={true}
                className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 flex-shrink-0 opacity-50"
              />

              {/* Imagen pequeña */}
              <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded bg-gray-50">
                <Thumbnail 
                  thumbnail={p.thumbnail} 
                  images={p.images} 
                  size="full"
                  className="!p-0 !bg-transparent !rounded-none w-full h-full object-cover opacity-50" 
                />
              </div>

              {/* Contenido compacto */}
              <div className="flex-1 min-w-0">
                {/* Título */}
                <LocalizedClientLink
                  href={`/products/${p.handle}`}
                  className="block group pointer-events-none"
                >
                  <Text
                    className="text-gray-900 font-medium text-sm leading-tight truncate opacity-50"
                  >
                    {p.title}
                  </Text>
                </LocalizedClientLink>

                {/* Precio con loading */}
                <div className="flex items-center gap-2 mt-1">
                  {displayPrice && (
                    <div className="text-lg font-bold text-gray-900 opacity-50">
                      <PreviewPrice price={displayPrice} />
                    </div>
                  )}
                  {/* Badge de descuento deshabilitado */}
                  {discountPercent !== null && discountPercent > 0 && (
                    <div className="bg-gray-300 text-gray-500 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      -{discountPercent}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Opciones con spinners */}
            {p.options && p.options.length > 0 && (
              <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                {p.options.map((option) => (
                  <div key={option.id} className="mb-2 last:mb-0">
                    <Text size="small" className="text-gray-600 text-xs mb-1 opacity-50">
                      {option.title}:
                    </Text>
                    <div className="flex flex-wrap gap-1">
                      {option.values?.map((value, idx) => (
                        <button
                          key={value.id}
                          disabled={true}
                          type="button"
                          className={`px-2 py-1 text-xs border rounded transition-colors flex items-center justify-center min-w-[40px] h-[24px] ${
                            idx === 0
                              ? 'bg-gray-900 text-white border-gray-900 opacity-50'
                              : 'border-gray-300 bg-white opacity-50'
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
        )
      })}

      {/* Botón principal con spinner */}
      <Button
        disabled={true}
        variant="primary"
        className="w-full mt-6 flex items-center justify-center opacity-75"
      >
        <Spinner className="w-4 h-4 mr-2" />
        Cargando productos...
      </Button>
    </div>
  )
}