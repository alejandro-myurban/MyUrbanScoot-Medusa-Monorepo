// app/components/bought-together/BoughtTogetherClient.tsx
"use client"

import { useState } from "react"
import { Button, Text } from "@medusajs/ui"
import { addToCart } from "@lib/data/cart"
import Thumbnail from "../thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPrice from "../product-preview/price"
import { getProductPrice } from "@lib/util/get-product-price"
import type { HttpTypes } from "@medusajs/types"

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
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [isAdding, setIsAdding] = useState(false)

  const toggleSelect = (variantId: string) => {
    setSelected((prev) => ({
      ...prev,
      [variantId]: !prev[variantId],
    }))
  }

  const handleAddSelected = async () => {
    const toAdd = products
      .map((p) => {
        const variant = p.variants?.[0]
        return variant ? { variantId: variant.id, quantity: 1 } : null
      })
      .filter(
        (v): v is { variantId: string; quantity: number } =>
          v !== null && selected[v.variantId]
      )

    if (toAdd.length === 0) return

    setIsAdding(true)
    try {
      await Promise.all(
        toAdd.map((params) =>
          addToCart({ ...params, countryCode: region.countries?.[0]?.iso_2 || "us" })
        )
      )
      // aquí podrías lanzar un toast de éxito
    } catch (err) {
      console.error("Error añadiendo al carrito:", err)
      // aquí un toast de error
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {products.map((p) => {
        const variant = p.variants?.[0]
        if (!variant) return null

        // obtener precio original
        const { cheapestPrice } = getProductPrice({ product: p })
        let displayPrice = cheapestPrice

        // lógica de descuento (igual que en ProductPreview)
        if (cheapestPrice && discount) {
          const discountAmount =
            typeof discount === "string" ? parseFloat(discount) : discount

          if (!isNaN(discountAmount) && discountAmount > 0) {
            // price as number
            const originalPriceNumber =
              cheapestPrice.calculated_price_number ||
              parseFloat(
                (cheapestPrice.calculated_price || "")
                  .toString()
                  .replace(/[^0-9.,]+/g, "")
                  .replace(",", ".")
              )

            // apply discount
            const discountedPriceNumber =
              originalPriceNumber * (1 - discountAmount / 100)

            // format
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

            // asignar descuento
            displayPrice = {
              ...cheapestPrice, 
              calculated_price_number: discountedPriceNumber,
              calculated_price: formattedDiscountedPrice,
              original_price: cheapestPrice.calculated_price,
              price_type: "sale",
            }
          }
        }

        console.log("displayPrice", displayPrice)

        return (
          <div key={variant.id} className="flex items-center gap-x-4">
            <input
              type="checkbox"
              checked={!!selected[variant.id]}
              onChange={() => toggleSelect(variant.id)}
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
                {displayPrice && <PreviewPrice price={displayPrice} />}
              </div>
            </LocalizedClientLink>
          </div>
        )
      })}

      <Button
        onClick={handleAddSelected}
        disabled={isAdding}
        variant="primary"
        className="w-full mt-4"
      >
        {isAdding ? "Añadiendo…" : "Añadir seleccionados al carrito"}
      </Button>
    </div>
  )
}
