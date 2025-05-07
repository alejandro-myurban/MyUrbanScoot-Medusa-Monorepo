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
        const { cheapestPrice } = getProductPrice({ product: p, variantId: variant.id })
        let displayPrice = cheapestPrice

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
          }
        }

        return (
          <div key={p.id} className="p-4 border rounded-lg">
            <div className="flex items-center gap-x-4 mb-3">
              <input
                type="checkbox"
                checked={extras.includes(variant.id)}
                onChange={() => toggleExtra(variant.id)}
                className="h-5 w-5"
              />
              <LocalizedClientLink
                href={`/products/${p.handle}`}
                className="flex items-center gap-x-4 group flex-1"
              >
                <Thumbnail thumbnail={p.thumbnail} images={p.images} size="small" />
                <div className="flex flex-col">
                  <Text className="group-hover:underline font-medium">
                    {p.title}
                  </Text>
                  {displayPrice && <PreviewPrice price={displayPrice} />}
                </div>
              </LocalizedClientLink>
            </div>

            {p.options && p.options.length > 0 && p.id && (
              <div className="pl-9 space-y-3">
                {p.options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <Text size="small" className="text-gray-600">
                      {option.title}:
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {option.values?.map((value) => (
                        <button
                          key={value.id}
                          onClick={() =>
                            option.id &&
                            handleOptionChange(p.id!, option.id, value.value)
                          }
                          type="button"
                          className={`px-3 py-1 text-sm border rounded-md transition-colors
                            ${
                              option.id &&
                              selectedOptions[p.id!]?.[option.id] === value.value
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'border-gray-300 hover:border-gray-500'
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
