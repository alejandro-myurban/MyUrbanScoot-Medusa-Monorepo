"use client"

import { useEffect, useState } from "react"
import { Text } from "@medusajs/ui"
import Thumbnail from "../thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPrice from "../product-preview/price"
import { getProductPrice } from "@lib/util/get-product-price"
import type { HttpTypes } from "@medusajs/types"
import { useCombinedCart } from "../bought-together/bt-context"

interface ClientProps {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  discount?: string | number
}

export default function BoughtTogetherClient({
  products,
  region,
  discount,
}: ClientProps) {
  const { extras, toggleExtra } = useCombinedCart()
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, Record<string, string>>
  >({})

  // Inicializar las opciones predeterminadas al cargar
  useEffect(() => {
    const defaultOptions: Record<string, Record<string, string>> = {}

    products.forEach((product) => {
      if (product.id) {
        const productOptions: Record<string, string> = {}
        product.options?.forEach((option) => {
          if (option.values && option.values.length > 0 && option.id) {
            productOptions[option.id] = option.values[0].value
          }
        })
        defaultOptions[product.id] = productOptions
      }
    })

    setSelectedOptions(defaultOptions)
  }, [products])

  const handleOptionChange = (
    productId: string,
    optionId: string,
    value: string
  ) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [optionId]: value,
      },
    }))
  }

  const findMatchingVariant = (product: HttpTypes.StoreProduct) => {
    if (!product.id || !selectedOptions[product.id]) {
      return product.variants?.[0]
    }
    const productOpts = selectedOptions[product.id]
    return (
      product.variants?.find((variant) =>
        variant.options?.every(
          (variantOption) =>
            variantOption.option_id &&
            productOpts[variantOption.option_id] === variantOption.value
        )
      ) || product.variants?.[0]
    )
  }

  return (
    <div className="space-y-6">
      {products.map((p) => {
        const variant = findMatchingVariant(p)
        if (!variant) return null

        // Precio original
        const { cheapestPrice } = getProductPrice({
          product: p,
          variantId: variant.id,
        })
        let displayPrice = cheapestPrice
        let discountPercent: number | null = null

        if (cheapestPrice && discount) {
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
            const formatted =
              typeof cheapestPrice.calculated_price === "string" &&
              cheapestPrice.calculated_price.includes("€")
                ? `€${discountedPriceNumber.toFixed(2)}`
                : typeof cheapestPrice.calculated_price === "string" &&
                  cheapestPrice.calculated_price.includes("$")
                ? `$${discountedPriceNumber.toFixed(2)}`
                : discountedPriceNumber.toFixed(2)
            displayPrice = {
              ...cheapestPrice,
              calculated_price_number: discountedPriceNumber,
              calculated_price: formatted,
              original_price: cheapestPrice.calculated_price,
              price_type: "sale",
            }
            // Calcular porcentaje de descuento
            discountPercent = Math.round(
              (1 - discountedPriceNumber / originalPriceNumber) * 100
            )
          }
        }

        // Si hay descuento natural del producto (sin discount prop)
        if (
          !discountPercent &&
          typeof cheapestPrice?.original_price_number === "number" &&
          typeof cheapestPrice.calculated_price_number === "number" &&
          cheapestPrice.original_price_number >
            cheapestPrice.calculated_price_number
        ) {
          const orig = cheapestPrice.original_price_number
          const calc = cheapestPrice.calculated_price_number
          discountPercent = Math.round((1 - calc / orig) * 100)
        }

        return (
          <div
            key={p.id}
            className={`font-dmSans bg-white overflow-hidden rounded-lg border-2 shadow-sm hover:shadow-md transition-all duration-200 ${
              extras.includes(variant.id) ? "border-black" : "border-gray-300"
            }`}
          >
            {/* Card clickeable */}
            <div
              className="flex items-start gap-3 p-3 cursor-pointer"
              onClick={() => toggleExtra(variant.id)}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={extras.includes(variant.id)}
                onChange={() => toggleExtra(variant.id)}
                className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 pointer-events-none"
              />

              {/* Imagen pequeña */}
              <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded bg-gray-50">
                <Thumbnail
                  thumbnail={p.thumbnail}
                  images={p.images}
                  size="full"
                  className="!p-0 !bg-transparent !rounded-none w-full h-full object-cover"
                />
              </div>

              {/* Contenido compacto */}
              <div className="flex-1 min-w-0">
                {/* Título - NO clickeable para selección */}
                <LocalizedClientLink
                  href={`/producto/${p.handle}`}
                  className="block group"
                  //@ts-ignore
                  onClick={(e) => e.stopPropagation()}
                >
                  <Text className="text-gray-900 font-medium text-sm leading-tight group-hover:underline truncate">
                    {p.title}
                  </Text>
                </LocalizedClientLink>

                {/* Solo precio principal */}
                <div className="flex items-center gap-2 mt-1">
                  {displayPrice && (
                    <div className="text-lg font-bold text-gray-900">
                      <PreviewPrice price={displayPrice} />
                    </div>
                  )}
                  {/* Badge pequeño de descuento */}
                  {discountPercent !== null && discountPercent > 0 && (
                    <div className="bg-mysRed-100 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      -{discountPercent}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Opciones compactas */}
            {p.options && p.options.length > 0 && p.id && (
              <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                {p.options.map((option) => (
                  <div key={option.id} className="mb-2 last:mb-0">
                    <Text size="small" className="text-gray-600 text-xs mb-1">
                      {option.title}:
                    </Text>
                    <div className="flex flex-wrap gap-1">
                      {option.values?.map((value) => (
                        <button
                          key={value.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            option.id &&
                              handleOptionChange(p.id!, option.id, value.value)
                          }}
                          type="button"
                          className={`px-2 py-1 text-xs border rounded transition-colors
                            ${
                              option.id &&
                              selectedOptions[p.id!]?.[option.id] ===
                                value.value
                                ? "bg-black/90 text-white border-black/90"
                                : "border-gray-300 hover:border-gray-500 bg-white"
                            }
                          `}
                        >
                          {value.value}
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
    </div>
  )
}
