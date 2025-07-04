"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useState, useRef } from "react"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { useTranslation } from "react-i18next"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function addBusinessDays(start: Date, days: number): Date {
  const date = new Date(start)
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) {
      added += 1
    }
  }
  return date
}

interface ItemWithEstimate extends HttpTypes.StoreCartLineItem {
  production: number
  shipping: number
  totalDays: number
  estimatedDate: Date
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calculatedPrices, setCalculatedPrices] = useState<
    Record<string, number>
  >({})
  const [itemsWithEstimate, setItemsWithEstimate] = useState<
    ItemWithEstimate[]
  >([])
  
  // Estados para el auto-submit
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false)
  const [hasUserSelectedShipping, setHasUserSelectedShipping] = useState(false)
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )

  // Verificar si el método seleccionado es de tipo calculated
  const isCalculatedShippingSelected =
    selectedShippingMethod?.price_type === "calculated"

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  // Función para auto-submit después de seleccionar método de envío
  const triggerAutoSubmit = useCallback(() => {
    // Limpiar timeout anterior si existe
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current)
    }

    setPendingAutoSubmit(true)
    
    // Esperar un poco para que la UI se actualice y luego hacer submit
    autoSubmitTimeoutRef.current = setTimeout(() => {
      console.log('🚀 Auto-submit activado después de seleccionar método de envío')
      handleSubmit()
      setPendingAutoSubmit(false)
    }, 1500) // 1.5 segundos de delay para mostrar feedback visual
  }, [handleSubmit])

  // Función modificada para incluir auto-submit
  const set = async (id: string) => {
    setIsLoading(true)
    setHasUserSelectedShipping(true)
    
    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      
      // ✅ Si la selección fue exitosa, activar auto-submit
      console.log('✅ Método de envío seleccionado exitosamente:', id)
      triggerAutoSubmit()
      
    } catch (err: any) {
      console.error('❌ Error seleccionando método de envío:', err)
      setError(err.message)
      setPendingAutoSubmit(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Limpiar timeouts al desmontar componente
  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const ids = (cart.items?.map((i) => i.product_id) || []).filter(
      (id): id is string => id !== undefined
    )
    if (!ids.length) return

    sdk.store.product
      .list(
        { id: ids, fields: "id,+metadata" },
        { next: { tags: ["products"] } }
      )
      .then(({ products }) => {
        // Mapeamos products por ID para acceso rápido
        const metaMap = products.reduce<Record<string, any>>((acc, p) => {
          acc[p.id] = p.metadata || {}
          return acc
        }, {})

        // Construimos el array enriquecido
        const enriched: ItemWithEstimate[] = (cart.items || []).map((item) => {
          const meta = item.product_id ? metaMap[item.product_id] || {} : {}
          const production = parseInt(meta.estimated_production_time ?? "0", 10)
          const shipping = parseInt(meta.shipping_time ?? "0", 10)
          const totalDays = production + shipping
          const estimatedDate = addBusinessDays(new Date(), totalDays)
          return {
            ...item,
            production,
            shipping,
            totalDays,
            estimatedDate,
          }
        })
        setItemsWithEstimate(enriched)
      })
      .catch((err) => {
        console.error("Error cargando metadata:", err)
      })
  }, [cart.items])

  // --- Lógica para calcular precios de métodos "calculated" ---
  useEffect(() => {
    if (!cart || !availableShippingMethods?.length) return

    const calculatedOptions = availableShippingMethods.filter(
      (option) => option.price_type === "calculated"
    )

    // Solo hacemos cálculos para opciones de tipo calculated
    if (calculatedOptions.length) {
      const promises = calculatedOptions.map((option) =>
        sdk.store.fulfillment.calculate(option.id, {
          cart_id: cart.id,
          data: {}, // Puedes pasar datos adicionales si tu provider los necesita
        })
      )

      Promise.allSettled(promises).then((res) => {
        const pricesMap: Record<string, number> = {}
        res
          .filter((r) => r.status === "fulfilled")
          .forEach((p: any) => {
            pricesMap[p.value?.shipping_option.id || ""] =
              p.value?.shipping_option.amount
          })
        setCalculatedPrices(pricesMap)
      })
    }
  }, [availableShippingMethods, cart])

  // Función para mostrar el precio correctamente
  const getShippingOptionPrice = useCallback(
    (option: HttpTypes.StoreCartShippingOption): string => {
      let amount = 0

      // Para opciones de tipo calculated, usamos el precio calculado
      if (option.price_type === "calculated") {
        if (!calculatedPrices[option.id]) {
          return "Calculando..."
        }
        amount = calculatedPrices[option.id]
      } else {
        // Para opciones de tipo flat, usamos el precio fijo
        amount = option.amount || 0
      }

      // Si el precio es 0, mostrar "GRATIS"
      if (amount === 0) {
        return "GRATIS"
      }

      return convertToLocale({
        amount,
        currency_code: cart?.currency_code || "EUR",
      })
    },
    [calculatedPrices, cart?.currency_code]
  )

  // Función para obtener el rango de fechas de entrega
  const getDeliveryDateRange = () => {
    if (!itemsWithEstimate.length) return null

    const minDays = Math.min(...itemsWithEstimate.map((item) => item.totalDays))
    const maxDays = Math.max(...itemsWithEstimate.map((item) => item.totalDays))

    const startDate = addBusinessDays(new Date(), minDays)
    // Añadir 2 días extra al final del rango
    const endDate = addBusinessDays(new Date(), maxDays + 2)

    return {
      minDays,
      maxDays: maxDays + 2, // Mostrar el rango con los días extra incluidos
      startDate,
      endDate,
    }
  }

  const deliveryRange = getDeliveryDateRange()

  console.log("CARRITO", cart)
  
  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row font-archivoBlack text-2xl gap-x-2 items-baseline uppercase",
            {
              "opacity-50 pointer-events-none select-none":
               cart.shipping_methods?.length === 0,
            }
          )}
        >
          {t("checkout.delivery")}
        </Heading>
        {/* { 
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )} */}
      </div>
      
      <div data-testid="delivery-options-container ">
        <div className="space-y-0 ">
          <RadioGroup value={selectedShippingMethod?.id} onChange={set} >
            {availableShippingMethods?.map((option, index) => {
              const isSelected = option.id === selectedShippingMethod?.id
              const isFirst = index === 0
              const isLast = index === availableShippingMethods.length - 1
              
              return (
                <div key={option.id} className="relative">
                  <RadioGroup.Option
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "relative block w-full bg-white border border-[#e6e6e6] cursor-pointer transition-all duration-200 ",
                      {
                        // Bordes del acordeón
                        "rounded-t-lg border-b-0": isFirst,
                        "border-b-0": !isFirst && !isLast,
                        "rounded-b-lg": isLast,
                        // Estados de selección
                        "bg-gray-50 border-gray-400": isSelected,
                        "hover:bg-gray-50": !isSelected,
                      }
                    )}
                  >
                    <div className="p-4 font-archivo">
                      {/* Header de la opción */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4">
                            <div className={clx(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                              {
                                "bg-gray-500": isSelected,
                                "border-gray-230 bg-white": !isSelected,
                              }
                            )}>
                              {isSelected && (
                                <div className="w-1 h-1 bg-black rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <span className="font-medium text-gray-900">
                            {option.name}
                          </span>
                        </div>
                        <span className="font-black text-lg font-archivoBlack text-gray-900">
                          {getShippingOptionPrice(option)}
                        </span>
                      </div>

                      {/* Información adicional expandida */}
                      {isSelected && (
                        <div className="mt-4 pl-7 space-y-2 border-t border-gray-200 pt-4">
                          {/* Para métodos calculated */}
                          {option.price_type === "calculated" && deliveryRange && (
                            <>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Tiempo producción:</span>{" "}
                                <span className="font-semibold">
                                  {deliveryRange.minDays === deliveryRange.maxDays
                                    ? `${deliveryRange.minDays} días`
                                    : `${deliveryRange.minDays}-${deliveryRange.maxDays} días`}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-900 font-medium">
                                Tu pedido llegará entre el{" "}
                                <span className="font-black">
                                  {deliveryRange.startDate.toLocaleDateString("es-ES", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </span>
                                {deliveryRange.minDays !== deliveryRange.maxDays && (
                                  <>
                                    {" y el "}
                                    <span className="font-black">
                                      {deliveryRange.endDate.toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "long", 
                                        year: "numeric",
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-500 italic">
                                si nadie la lía por el camino
                              </div>
                            </>
                          )}

                          {/* Para métodos flat rate */}
                          {option.price_type === "flat" && (
                            <div className="text-sm text-gray-700">
                              {option.name.includes("Express") && "1-2 días laborales"}
                              {option.name.includes("Standard") && "3-5 días laborales"}
                              {option.name.includes("Recogida") && "Disponible para recogida"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </RadioGroup.Option>
                </div>
              )
            })}
          </RadioGroup>
        </div>

        {/* Mensaje de feedback cuando se está preparando el auto-submit */}
        {pendingAutoSubmit && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <Text className="text-sm text-blue-700">
                ✅ Método de envío seleccionado - continuando al pago...
              </Text>
            </div>
          </div>
        )}

        <ErrorMessage
          error={error}
          data-testid="delivery-option-error-message"
        />
      </div>
      
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping