"use client"

import { Button, toast, Toaster } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import MobileActions from "./mobile-actions"
import ProductPrice from "../product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useColorContext } from "@lib/context/color-content-provider"
import { useCombinedCart } from "../bought-together/bt-context"
import { useTranslation } from "react-i18next"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce(
    (acc: Record<string, string | undefined>, varopt: any) => {
      if (
        varopt.option &&
        varopt.value !== null &&
        varopt.value !== undefined
      ) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    },
    {}
  )
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const { setSelectedColor } = useColorContext()
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string
  const searchParams = useSearchParams()
  const { extras, clearExtras, clearCustomFields, customMetadata } =
    useCombinedCart()
  const { t } = useTranslation()
  const initialColor = useMemo(() => {
    const urlColor = searchParams?.get("color")
    const colorOption = product.options?.find(
      (opt) => opt.title === "Color" || opt.title === "Base"
    )
    const validColors = colorOption?.values?.map((v) => v.value) || []

    // Validate URL color exists in product options
    if (urlColor && validColors.includes(urlColor)) {
      return urlColor
    }

    // Fallback to first available color
    return validColors[0] || ""
  }, [searchParams, product.options])

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})

      // Actualiza el contexto si hay una opción "Base" o "Color"
      if (variantOptions?.Base) {
        setSelectedColor(variantOptions.Base)
      } else if (variantOptions?.Color) {
        setSelectedColor(variantOptions.Color)
      }
    }
  }, [product.variants, setSelectedColor])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    try {
      setOptions((prev) => ({
        ...prev,
        [title]: value,
      }))

      // Update context if it's a relevant option
      if (title === "Base" || title === "Color") {
        console.log(`Setting ${title} option to:`, value)
        setSelectedColor(value)
      }
    } catch (error) {
      console.error("Error setting option value:", error)
    }
  }

  useEffect(() => {
    const baseOption = product.options?.find((opt) => opt.title === "Base")
    const colorOption = product.options?.find((opt) => opt.title === "Color")

    if (baseOption?.values?.length && !options.Base) {
      setOptions((prev) => ({
        ...prev,
        Base: initialColor,
      }))
      setSelectedColor(initialColor)
    } else if (colorOption?.values?.length && !options.Color) {
      setOptions((prev) => ({
        ...prev,
        Color: initialColor,
      }))
      setSelectedColor(initialColor)
    }
  }, [product.options, initialColor])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    try {
      // 1) añado el producto principal con los metadatos personalizados
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
        metadata: customMetadata, // Añadimos los metadatos personalizados aquí
      })

      // 2) añado los extras marcados
      if (extras.length) {
        await Promise.all(
          extras.map((variantId) =>
            addToCart({
              variantId,
              quantity: 1,
              countryCode,
            })
          )
        )
        clearExtras()
      }

      // 3) Limpiamos los campos personalizados
      clearCustomFields()

      toast.success("¡Producto añadido al carrito con éxito!")
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Error al añadir al carrito")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.title ?? ""]}
                    updateOption={setOptionValue}
                    title={option.title ?? ""}
                    data-testid="product-options"
                    disabled={!!disabled || isAdding}
                  />
                </div>
              ))}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />
        <Toaster />
        <Button
          onClick={handleAddToCart}
          disabled={!inStock || !selectedVariant || !!disabled || isAdding}
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : t("product.addToCart")}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
