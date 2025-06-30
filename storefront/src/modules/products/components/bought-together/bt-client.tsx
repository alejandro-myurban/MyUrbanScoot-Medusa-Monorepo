  "use client"

  import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
    // 👈 AGREGAR setBoughtTogetherPrice del contexto
    const { extras, toggleExtra, setBoughtTogetherPrice } = useCombinedCart()
    const [selectedOptions, setSelectedOptions] = useState<
      Record<string, Record<string, string>>
    >({})

    // Usar useRef para rastrear si ya inicializamos las opciones
    const initializedRef = useRef(false)

    // Crear un ID estable para los productos para evitar re-renders innecesarios
    const productsKey = useMemo(
      () => products.map((p) => p.id).join(","),
      [products]
    )

    // Memoizar las opciones predeterminadas para evitar recálculos
    const defaultOptions = useMemo(() => {
      const options: Record<string, Record<string, string>> = {}

      products.forEach((product) => {
        if (product.id) {
          const productOptions: Record<string, string> = {}
          product.options?.forEach((option) => {
            if (option.values && option.values.length > 0 && option.id) {
              productOptions[option.id] = option.values[0].value
            }
          })
          options[product.id] = productOptions
        }
      })

      return options
    }, [productsKey])

    // Inicializar las opciones predeterminadas SOLO una vez
    useEffect(() => {
      if (!initializedRef.current && Object.keys(defaultOptions).length > 0) {
        setSelectedOptions(defaultOptions)
        initializedRef.current = true
      }
    }, [defaultOptions])

    // 👈 NUEVA FUNCIÓN: Calcular precio total de productos seleccionados
    const calculateTotalPrice = useCallback(() => {
      let totalPrice = 0

      // Iterar sobre cada producto en extras (productos seleccionados)
      extras.forEach((variantId) => {
        // Encontrar el producto que contiene esta variante
        const product = products.find((p) => 
          p.variants?.some((v) => v.id === variantId)
        )
        
        if (product) {
          // Encontrar la variante específica
          const variant = product.variants?.find((v) => v.id === variantId)
          
          if (variant) {
            // Obtener el precio de la variante
            const { cheapestPrice } = getProductPrice({
              product,
              variantId: variant.id,
            })

            if (cheapestPrice) {
              let priceToAdd = cheapestPrice.calculated_price_number || 0

              // Aplicar descuento si existe
              if (discount) {
                const discountAmount = typeof discount === "string" ? parseFloat(discount) : discount
                if (!isNaN(discountAmount) && discountAmount > 0) {
                  priceToAdd = priceToAdd * (1 - discountAmount / 100)
                }
              }

              totalPrice += priceToAdd
            }
          }
        }
      })

      return totalPrice
    }, [extras, products, discount])

    // 👈 NUEVO useEffect: Actualizar precio en el contexto cuando cambien los extras
    useEffect(() => {
      const totalPrice = calculateTotalPrice()
      setBoughtTogetherPrice(totalPrice)
    }, [extras, calculateTotalPrice, setBoughtTogetherPrice])

    // 👈 MODIFICAR handleOptionChange para recalcular precio cuando cambien las opciones
    const handleOptionChange = useCallback(
      (productId: string, optionId: string, value: string) => {
        setSelectedOptions((prev) => ({
          ...prev,
          [productId]: {
            ...(prev[productId] || {}),
            [optionId]: value,
          },
        }))
        
        // Recalcular precio después de cambiar opciones
        // Usamos setTimeout para asegurar que el estado se actualice primero
        setTimeout(() => {
          const totalPrice = calculateTotalPrice()
          setBoughtTogetherPrice(totalPrice)
        }, 0)
      },
      [calculateTotalPrice, setBoughtTogetherPrice]
    )

    // Memoizar la función de búsqueda de variantes
    const findMatchingVariant = useCallback(
      (product: HttpTypes.StoreProduct) => {
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
      },
      [selectedOptions]
    )

    // 👈 NUEVO: Limpiar precio cuando el componente se desmonta
    useEffect(() => {
      return () => {
        setBoughtTogetherPrice(0)
      }
    }, [setBoughtTogetherPrice])

    return (
      <div className="space-y-4 pb-4">
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
              discountPercent = Math.round(
                (1 - discountedPriceNumber / originalPriceNumber) * 100
              )
            }
          }

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
                                    handleOptionChange(
                                      p.id!,
                                      option.id,
                                      value.value
                                    )
                                }}
                                type="button"
                                className={`px-2 py-1 text-xs border rounded transition-colors
                                  ${
                                    option.id &&
                                    selectedOptions[p.id!]?.[option.id] ===
                                      value.value
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
                <div className="flex flex-col items-end text-right font-archivoBlack">
                  {displayPrice && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-gray-900 font-archivoBlack">
                          <PreviewPrice price={displayPrice} />
                        </div>
                        {/* Badge de descuento */}
                        {discountPercent !== null && discountPercent > 0 && (
                          <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                            -{discountPercent}%
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Layout mobile */}
              <div className="md:hidden p-3">
                <div className="flex items-center gap-3">
                  {/* Imagen mobile */}
                  <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    <Thumbnail
                      thumbnail={p.thumbnail}
                      images={p.images}
                      size="full"
                      className="!p-0 !bg-transparent !rounded-none w-full h-full object-cover"
                    />
                  </div>

                  {/* Contenido mobile con título arriba a la derecha */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between flex-col items-start mb-2">
                      {/* Título mobile */}
                      <LocalizedClientLink
                        href={`/producto/${p.handle}`}
                        className="block group flex-1 mr-2"
                      >
                        <Text className="text-gray-900 font-bold font-archivoBlack mb-2 text-base leading-tight group-hover:underline uppercase">
                          {p.title}
                        </Text>
                      </LocalizedClientLink>

                      {/* Precio arriba a la derecha mobile */}
                      {displayPrice && (
                        <div className="flex items-center gap-1">
                          <div className="text-sm font-bold flex gap-2 text-gray-900">
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
                                      handleOptionChange(
                                        p.id!,
                                        option.id,
                                        value.value
                                      )
                                  }}
                                  type="button"
                                  className={`px-2 py-1 text-xs border rounded transition-colors
                                    ${
                                      option.id &&
                                      selectedOptions[p.id!]?.[option.id] ===
                                        value.value
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