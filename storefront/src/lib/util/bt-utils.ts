// app/lib/bought-together-utils.ts
import type { HttpTypes } from "@medusajs/types"


// 1. Selected inicial: todas las primeras variantes en false
export function getInitialSelected(
  products: HttpTypes.StoreProduct[]
): Record<string, boolean> {
  return products
    .flatMap((p) => p.variants?.[0]?.id || [])
    .reduce<Record<string, boolean>>((acc, vid) => {
      acc[vid] = false
      return acc
    }, {})
}

// 2. Options iniciales: la primera de cada opción
export function getInitialOptions(
  products: HttpTypes.StoreProduct[]
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  products.forEach((p) => {
    if (!p.id) return
    out[p.id] = {}
    p.options?.forEach((opt) => {
      if (opt.id && opt.values?.[0]) {
        out[p.id][opt.id] = opt.values[0].value
      }
    })
  })
  return out
}

// 3. Dada una product y unas opciones, devuelve la variante coincidente
export function findMatchingVariant(
  product: HttpTypes.StoreProduct,
  selectedOptions: Record<string, Record<string, string>>
) {
  const opts = product.id ? selectedOptions[product.id] : {}
  return (
    product.variants?.find((v) =>
      v.options?.every((vo) => vo.option_id && opts[vo.option_id] === vo.value)
    ) ?? product.variants?.[0]
  )
}

// 4. Aplica el descuento al objeto cheapestPrice
export function applyDiscount(
  cheapestPrice: {
    calculated_price: string | number
    calculated_price_number?: number
  },
  discount?: string | number
) {
  if (!discount) return cheapestPrice

  const discountNum =
    typeof discount === "string" ? parseFloat(discount) : discount

  if (isNaN(discountNum) || discountNum <= 0) {
    return cheapestPrice
  }

  const originalNumber =
    cheapestPrice.calculated_price_number ??
    parseFloat(
      cheapestPrice
        .calculated_price!.toString()
        .replace(/[^0-9.,]+/g, "")
        .replace(",", ".")
    )
  const newNumber = originalNumber * (1 - discountNum / 100)
  let newStr: string

  const cp = cheapestPrice.calculated_price!.toString()
  if (cp.includes("€")) newStr = `€${newNumber.toFixed(2)}`
  else if (cp.includes("$")) newStr = `$${newNumber.toFixed(2)}`
  else newStr = newNumber.toFixed(2)

  return {
    ...cheapestPrice,
    calculated_price_number: newNumber,
    calculated_price: newStr,
    original_price: cheapestPrice.calculated_price,
    price_type: "sale",
  }
}
