// filterUtils.ts
import { HttpTypes } from "@medusajs/types"

export type Range = [number, number]

/** Cambia un rango dentro del state */
export const handleRangeChange = (
  key: string,
  newRange: Range,
  selectedFilters: any,
  setSelectedFilters: (filters: any) => void
) => {
  setSelectedFilters({ ...selectedFilters, [key]: newRange })
}

/** Toggle de checkboxes */
export const toggleCheckbox = (
  key: string,
  value: string,
  selectedFilters: any,
  setSelectedFilters: (filters: any) => void
) => {
  const current = selectedFilters[key] || []
  const isSelected = current.includes(value)

  const newValues = isSelected
    ? current.filter((v: string) => v !== value)
    : [...current, value]

  setSelectedFilters({ ...selectedFilters, [key]: newValues })
}

/** Cálculo dinámico min/max */
export const calculateMinMax = (
  products: HttpTypes.StoreProduct[],
  metadataKey: string,
  defaultValue: Range
): Range => {
  let min = Infinity
  let max = -Infinity

  products.forEach((product) => {
    const value = Number(product.metadata?.[metadataKey])
    if (!isNaN(value)) {
      min = Math.min(min, value)
      max = Math.max(max, value)
    }
  })

  if (min === Infinity || max === -Infinity) {
    return defaultValue
  }

  const buffer = max * 0.1 > 10 ? Math.round(max * 0.1) : 10
  return [min, max + buffer]
}
