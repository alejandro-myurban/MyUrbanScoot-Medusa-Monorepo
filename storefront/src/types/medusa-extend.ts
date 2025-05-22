// types/medusa-extended.ts
import { HttpTypes } from "@medusajs/types"

// Tipo para las traducciones de opciones de producto
export interface ProductOptionTranslation {
  title?: string
  [key: string]: any
}

// Tipo para las traducciones de valores de opciones
export interface ProductOptionValueTranslation {
  value?: string
  label?: string
  [key: string]: any
}

// Tipo para las traducciones del producto
export interface ProductTranslation {
  title?: string
  description?: string
  subtitle?: string
  [key: string]: any
}

// Extender el tipo de valor de opción con traducciones
export interface StoreProductOptionValueWithTranslations extends HttpTypes.StoreProductOptionValue {
  translations?: ProductOptionValueTranslation
}

// Extender el tipo de opción con traducciones
export interface StoreProductOptionWithTranslations extends HttpTypes.StoreProductOption {
  translations?: ProductOptionTranslation
  values?: StoreProductOptionValueWithTranslations[]
}

// Extender el tipo de producto con traducciones
export interface StoreProductWithTranslations extends HttpTypes.StoreProduct {
  translations?: ProductTranslation
  options: StoreProductOptionWithTranslations[] | null
}

// Tipo para props de componentes que usan productos traducidos
export interface ProductTemplateProps {
  product: StoreProductWithTranslations
  region: HttpTypes.StoreRegion
  countryCode: string
  searchParams?: { [key: string]: string | string[] | undefined }
  useDirectActions?: boolean
}

// Tipo para el wrapper de acciones de producto
export interface ProductActionsWrapperProps {
  id: string
  region: HttpTypes.StoreRegion
  countryCode: string
}

// Helper type guards para verificar si un producto tiene traducciones
export const hasTranslations = (
  product: HttpTypes.StoreProduct | StoreProductWithTranslations
): product is StoreProductWithTranslations => {
  return 'translations' in product && product.translations !== undefined
}

export const hasOptionTranslations = (
  option: HttpTypes.StoreProductOption | StoreProductOptionWithTranslations
): option is StoreProductOptionWithTranslations => {
  return 'translations' in option && option.translations !== undefined
}

export const hasValueTranslations = (
  value: HttpTypes.StoreProductOptionValue | StoreProductOptionValueWithTranslations
): value is StoreProductOptionValueWithTranslations => {
  return 'translations' in value && value.translations !== undefined
}