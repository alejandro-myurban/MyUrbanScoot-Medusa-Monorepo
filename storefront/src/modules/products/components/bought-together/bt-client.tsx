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
    <div className="space-y-4">
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
            className={`font-dmSans bg-white overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
              extras.includes(variant.id) ? "border-black" : "border-gray-300"
            }`}
            onClick={() => toggleExtra(variant.id)}
          >
            {/* Layout desktop */}
            <div className="hidden md:flex items-center gap-4 p-4">
              {/* Imagen cuadrada */}
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                <Thumbnail
                  thumbnail={p.thumbnail}
                  images={p.images}
                  size="full"
                  className="!p-0 !bg-transparent !rounded-none w-full h-full object-cover"
                />
              </div>

              {/* Contenido desktop */}
              <div className="flex-1 min-w-0">
                {/* Título */}
                <LocalizedClientLink
                  href={`/producto/${p.handle}`}
                  className="block group mb-1"
                >
                  <Text className="text-gray-900 font-bold text-sm leading-tight group-hover:underline uppercase">
                    {p.title}
                  </Text>
                </LocalizedClientLink>

                {/* Opciones con botones */}
                {p.options && p.options.length > 0 && p.id && (
                  <div className="space-y-1 mb-2">
                    {p.options.map((option) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <Text className="text-gray-500 text-xs">
                          {option.title}:
                        </Text>
                        <div className="flex gap-1">
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
                                  selectedOptions[p.id!]?.[option.id] === value.value
                                    ? "bg-black text-white border-black"
                                    : "border-gray-300 hover:border-gray-500 bg-white text-gray-700"
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

              {/* Precio a la derecha desktop */}
              <div className="flex flex-col items-end text-right">
                {displayPrice && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-gray-900">
                        <PreviewPrice price={displayPrice} />
                      </div>
                      {/* Badge de descuento */}
                      {discountPercent !== null && discountPercent > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                          -{discountPercent}%
                        </div>
                      )}
                    </div>
                    {/* Precio original tachado debajo */}

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
                    className="!p-0 !bg-transparent !rounded-none w-full h-full object-cover"
                  />
                </div>

                {/* Contenido mobile con título arriba a la derecha */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    {/* Título mobile */}
                    <LocalizedClientLink
                      href={`/producto/${p.handle}`}
                      className="block group flex-1 mr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Text className="text-gray-900 font-bold text-xs leading-tight group-hover:underline uppercase">
                        {p.title}
                      </Text>
                    </LocalizedClientLink>

                    {/* Precio arriba a la derecha mobile */}
                    {displayPrice && (
                      <div className="flex items-center gap-1">
                        <div className="text-sm font-bold text-gray-900">
                          <PreviewPrice price={displayPrice} />
                        </div>
                        {/* Badge de descuento mobile */}
                        {discountPercent !== null && discountPercent > 0 && (
                          <div className="bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded">
                            -{discountPercent}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>


                  {/* Opciones mobile con botones */}
                  {p.options && p.options.length > 0 && p.id && (
                    <div className="space-y-1">
                      {p.options.map((option) => (
                        <div key={option.id}>
                          <Text className="text-gray-500 text-xs mb-1 block">
                            {option.title}:
                          </Text>
                          <div className="flex gap-1 flex-wrap">
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
                                    selectedOptions[p.id!]?.[option.id] === value.value
                                      ? "bg-black text-white border-black"
                                      : "border-gray-300 hover:border-gray-500 bg-white text-gray-700"
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
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}