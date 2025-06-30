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
import Financing from "../financing"
import CustomNameNumberForm from "../custom-name-number"
import PopularBadge from "../badge-top-seller"
import BoughtTogether from "../bought-together"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  // Nueva prop para controlar si mostrar BoughtTogether
  showBoughtTogether?: boolean
  boughtTogether?: React.ReactNode
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
  showBoughtTogether = true, // Por defecto mostrar (para compatibilidad)
  boughtTogether,
}: ProductActionsProps) {
  const { setSelectedColor, optionTitle } = useColorContext()
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [additionalPrice, setAdditionalPrice] = useState(0)
  const countryCode = useParams().countryCode as string
  const searchParams = useSearchParams()
  const {
    extras,
    clearExtras,
    clearCustomFields,
    customMetadata,
    boughtTogetherPrice, // 👈 Nuevo
    clearBoughtTogetherPrice, // 👈 Nuevo
  } = useCombinedCart()
  const { t } = useTranslation()

  const initialSetupDone = useRef(false)
  const realOptionNames = useRef(new Set<string>())

  // Collect real option names when component mounts
  useEffect(() => {
    if (product.options) {
      product.options.forEach((option) => {
        if (option.title) {
          realOptionNames.current.add(option.title)
        }
      })
    }
  }, [product.options])

  const initialColor = useMemo(() => {
    const urlColor = searchParams?.get("color")
    const colorOption = product.options?.find(
      (opt) =>
        opt.title === "Color" || opt.title === "Base" || opt.title === "Pedana"
    )
    const validColors = colorOption?.values?.map((v) => v.value) || []

    if (urlColor && validColors.includes(urlColor)) {
      return urlColor
    }

    return validColors[0] || ""
  }, [searchParams, product.options])

  // Handle single variant products only once
  useEffect(() => {
    if (product.variants?.length === 1 && !initialSetupDone.current) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})

      const colorValue =
        variantOptions?.[optionTitle] ||
        variantOptions?.Base ||
        variantOptions?.Color
      if (colorValue) {
        setSelectedColor(colorValue)
      }

      initialSetupDone.current = true
    }
  }, [product.variants, setSelectedColor, optionTitle])

  // Set initial color option only once
  useEffect(() => {
    if (initialSetupDone.current) return

    const colorOptions = product.options?.filter(
      (opt) =>
        opt.title === "Pedana" || opt.title === "Base" || opt.title === "Color"
    )

    if (colorOptions?.length && initialColor) {
      const newOptions = { ...options }
      let updated = false

      colorOptions.forEach((option) => {
        if (option.title && option.values?.length && !options[option.title]) {
          newOptions[option.title] = initialColor
          updated = true
        }
      })

      if (updated) {
        setOptions(newOptions)
        setSelectedColor(initialColor)
        initialSetupDone.current = true
      }
    }
  }, [product.options, initialColor, options, optionTitle])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (title: string, value: string) => {
    try {
      setOptions((prev) => ({
        ...prev,
        [title]: value,
      }))

      if (title === "Pedana" || title === "Base" || title === "Color") {
        setSelectedColor(value)
      }
    } catch (error) {
      console.error("Error setting option value:", error)
    }
  }

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    if (selectedVariant?.allow_backorder) {
      return true
    }

    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
        metadata: customMetadata,
      })

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

      clearCustomFields()
      clearBoughtTogetherPrice()
      setAdditionalPrice(0)

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
            <div className="flex flex-col gap-y-8">
              {(product.options || []).map((option) => (
                <div key={option.id} className="relative">
                  <OptionSelect
                    product={product}
                    option={option}
                    current={options[option.title]}
                    updateOption={setOptionValue}
                    //@ts-ignore
                    title={option.translations?.title || option.title}
                    data-testid="product-options"
                    disabled={!!disabled || isAdding}
                  />
                </div>
              ))}

              <CustomNameNumberForm
                product={product}
                onPriceChange={setAdditionalPrice}
              />
            </div>
          )}
        </div>

        {product.type?.value === "Patinetes" && (
          <Financing
            productName={selectedVariant?.title ?? product.title ?? ""}
            price={selectedVariant?.calculated_price?.calculated_amount ?? 0}
          />
        )}

        {boughtTogether}
        <Divider />

        <ProductPrice
          product={product} 
          variant={selectedVariant}
          additionalPriceCustom={additionalPrice}
          additionalPriceBoughtTogether={boughtTogetherPrice}
        />

        <Toaster />

        <div className="">
          <Button
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant || !!disabled || isAdding}
            variant="primary"
            className="w-full h-10 uppercase font-archivoBlack shadow-none bg-[#2C2C2C] hover:bg-black/80 rounded-md border-none"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant
              ? t("actions.select_variant")
              : !inStock
              ? "Out of stock"
              : t("actions.add_to_cart")}
          </Button>
        </div>

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
