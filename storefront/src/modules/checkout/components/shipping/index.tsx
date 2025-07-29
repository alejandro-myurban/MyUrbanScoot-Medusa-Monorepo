"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import Spinner from "@modules/common/icons/spinner"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useState, useRef, useMemo } from "react"
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

  console.log("🚚 Métodos de envío disponibles:", availableShippingMethods)

  // Estados para el auto-submit
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false)
  const [hasUserSelectedShipping, setHasUserSelectedShipping] = useState(false)
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ NUEVO: Estados para navegación automática con envío gratis
  const [freeShippingApplied, setFreeShippingApplied] = useState(false)
  const [autoNavigationTimeout, setAutoNavigationTimeout] = useState<NodeJS.Timeout | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()

  // Determinar si este step está activo
  const isOpen = searchParams.get("step") === "delivery"

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )

  // Verificar si el método seleccionado es de tipo calculated
  const isCalculatedShippingSelected =
    selectedShippingMethod?.price_type === "calculated"

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const navigateToNextStep = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const shouldApplyFreeShipping = useCallback(() => {
    const itemTotal = cart?.item_total || 0
    const countryCode =
      cart?.billing_address?.country_code ||
      cart?.shipping_address?.country_code

    return itemTotal >= 100 && countryCode === "es"
  }, [
    cart?.item_total,
    cart?.billing_address?.country_code,
    cart?.shipping_address?.country_code,
  ])

  const findFreeShippingMethod = useCallback(() => {
    return availableShippingMethods?.find(
      (method) =>
        method.name.toLowerCase().includes("gratis") ||
        method.name.toLowerCase().includes("free") 
    )
  }, [availableShippingMethods])

  const applyFreeShippingAutomatically = useCallback(async () => {
    const freeMethod = findFreeShippingMethod()
    if (!freeMethod) return

    try {
      console.log("🎉 Aplicando envío gratis automáticamente:", freeMethod.name)
      await setShippingMethod({
        cartId: cart.id,
        shippingMethodId: freeMethod.id,
      })
      
      console.log("✅ Método de envío gratis aplicado exitosamente")
      
      // ✅ NUEVO: Forzar refresh para asegurar que los datos se actualicen
      router.refresh()
      
      // ✅ NUEVO: Esperar un poco después del refresh antes de marcar como aplicado
      setTimeout(() => {
        console.log("🎯 Marcando freeShippingApplied como true")
        setFreeShippingApplied(true)
      }, 800)
      
    } catch (error) {
      console.error("❌ Error aplicando envío gratis automático:", error)
    }
  }, [findFreeShippingMethod, cart.id, router])

  const visibleShippingMethods = useMemo(() => {
    if (!availableShippingMethods) return null

    const freeMethod = findFreeShippingMethod()
    if (!freeMethod) return availableShippingMethods

    // Ocultar el método gratis de la UI
    return availableShippingMethods.filter(
      (method) => method.id !== freeMethod.id
    )
  }, [availableShippingMethods, findFreeShippingMethod])

  // ✅ FIX 1: Añadir delay para permitir que los datos se actualicen después de navegación
  useEffect(() => {
    if (!isOpen || !availableShippingMethods?.length) return

    // ✅ Usar setTimeout para permitir que el cart se actualice completamente
    const checkFreeShippingTimeout = setTimeout(() => {
      const shouldApply = shouldApplyFreeShipping()
      const freeMethod = findFreeShippingMethod()
      const currentMethod = selectedShippingMethod

      console.log("🔍 Verificando condiciones envío gratis (con delay):", {
        shouldApply,
        hasFreeMethod: !!freeMethod,
        currentMethodId: currentMethod?.id,
        freeMethodId: freeMethod?.id,
        itemTotal: cart?.item_total,
        countryCode:
          cart?.billing_address?.country_code ||
          cart?.shipping_address?.country_code,
        hasShippingAddress: !!cart?.shipping_address,
      })

      if (shouldApply && freeMethod) {
        // Si debe aplicarse y no está ya seleccionado
        if (!currentMethod || currentMethod.id !== freeMethod.id) {
          console.log("✅ Aplicando envío gratis automáticamente")
          applyFreeShippingAutomatically()
        }
      } else if (freeMethod && currentMethod?.id === freeMethod.id) {
        // Si ya no se cumplen las condiciones pero el método gratis está seleccionado
        console.log("⚠️ Ya no se cumplen las condiciones para envío gratis")
      }
    }, 500) // ✅ Esperar 500ms para que los datos se actualicen

    return () => clearTimeout(checkFreeShippingTimeout)
  }, [
    isOpen,
    availableShippingMethods,
    cart?.shipping_address, // ✅ Añadir shipping_address como dependencia
    cart?.item_total,
    cart?.billing_address?.country_code,
    cart?.shipping_address?.country_code,
  ])

  // ✅ FIX 2: Navegación automática sin bucles - usar ref para evitar re-renders
  const navigationScheduledRef = useRef(false)
  
  useEffect(() => {
    const freeMethod = findFreeShippingMethod()
    const isCurrentlyFreeShipping = selectedShippingMethod?.id === freeMethod?.id
    
    console.log("🔍 Debug navegación automática:", {
      isOpen,
      freeShippingApplied,
      isCurrentlyFreeShipping,
      shouldApplyFreeShipping: shouldApplyFreeShipping(),
      navigationScheduled: navigationScheduledRef.current,
      selectedMethodId: selectedShippingMethod?.id,
      freeMethodId: freeMethod?.id,
    })
    
    // Solo programar navegación si:
    // 1. Está abierto el step
    // 2. Se aplicó envío gratis
    // 3. Es realmente envío gratis
    // 4. Se cumplen las condiciones
    // 5. NO se ha programado ya la navegación
    if (
      isOpen && 
      freeShippingApplied && 
      isCurrentlyFreeShipping && 
      shouldApplyFreeShipping() &&
      !navigationScheduledRef.current
    ) {
      console.log("🚀 Programando navegación automática (SOLO UNA VEZ)...")
      navigationScheduledRef.current = true
      
      // Limpiar timeout anterior si existe
      if (autoNavigationTimeout) {
        clearTimeout(autoNavigationTimeout)
      }
      
      // Programar navegación después de 3 segundos
      const timeout = setTimeout(() => {
        console.log("✅ Ejecutando navegación automática a payment...")
        router.replace(pathname + "?step=payment", { scroll: false })
        // Reset estados
        setFreeShippingApplied(false)
        navigationScheduledRef.current = false
      }, 1000)
      
      setAutoNavigationTimeout(timeout)
    }
    
    // Reset si las condiciones ya no se cumplen
    if (!isOpen || !isCurrentlyFreeShipping || !shouldApplyFreeShipping()) {
      if (navigationScheduledRef.current) {
        console.log("🔄 Cancelando navegación programada - condiciones cambiaron")
        navigationScheduledRef.current = false
      }
      if (autoNavigationTimeout) {
        clearTimeout(autoNavigationTimeout)
        setAutoNavigationTimeout(null)
      }
    }
  }, [
    isOpen,
    freeShippingApplied, 
    selectedShippingMethod?.id, // Solo el ID, no todo el objeto
    cart?.item_total,
    cart?.shipping_address?.country_code, // Solo country_code específico
  ])

  // ✅ NUEVO: Limpiar timeout al desmontar componente
  useEffect(() => {
    return () => {
      if (autoNavigationTimeout) {
        clearTimeout(autoNavigationTimeout)
      }
    }
  }, [autoNavigationTimeout])

  // Función mejorada para verificar el cart desde el servidor
  const checkShippingMethodUpdated = useCallback(async () => {
    try {
      console.log("🔍 Verificando método de envío desde servidor...")

      // Obtener el cart actualizado del servidor
      const response = await sdk.store.cart.retrieve(cart.id)
      const updatedCart = response.cart

      console.log("🔍 Estado del cart desde servidor:", {
        hasShippingMethods: !!updatedCart?.shipping_methods?.length,
        selectedMethodId:
          updatedCart?.shipping_methods?.at(-1)?.shipping_option_id,
      })

      if (updatedCart?.shipping_methods?.length) {
        console.log("🔄 Método de envío actualizado, navegando a payment...")
        setPendingAutoSubmit(false)
        navigateToNextStep()
        return
      } else {
        console.log("⏳ Método de envío aún no actualizado, reintentando...")
        // Reintentar después de 500ms
        setTimeout(checkShippingMethodUpdated, 500)
      }
    } catch (error) {
      console.error("❌ Error verificando cart desde servidor:", error)
      setPendingAutoSubmit(false)
      setError(
        "Error verificando el método de envío. Por favor, intenta de nuevo."
      )
    }
  }, [cart.id, navigateToNextStep])

  // Función para auto-submit después de seleccionar método de envío
  const triggerAutoSubmit = useCallback(() => {
    // Limpiar timeout anterior si existe
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current)
    }

    setPendingAutoSubmit(true)
    console.log("🚀 Iniciando verificación del método de envío...")

    // Esperar un poco para que el servidor procese la actualización y luego verificar
    setTimeout(checkShippingMethodUpdated, 1000)
  }, [checkShippingMethodUpdated])

  // Función principal para seleccionar método de envío
  const set = async (id: string) => {
    setIsLoading(true)
    setHasUserSelectedShipping(true)
    setError(null) // Limpiar errores previos

    try {
      console.log("🔄 Seleccionando método de envío:", id)
      await setShippingMethod({ cartId: cart.id, shippingMethodId: id })

      // Forzar un refresh del server state en Next.js
      router.refresh()

      console.log("✅ Método de envío seleccionado exitosamente:", id)

      // Pequeño delay para que el refresh tome efecto, luego verificar
      setTimeout(() => {
        triggerAutoSubmit()
      }, 300)
    } catch (err: any) {
      console.error("❌ Error seleccionando método de envío:", err)
      setError(err.message || "Error al seleccionar el método de envío")
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

  // ✅ NUEVO: Componente para mostrar mensaje de envío gratis con countdown
  const FreeShippingMessage = () => {
    const [countdown, setCountdown] = useState(3)
    
    useEffect(() => {
      if (freeShippingApplied && countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(prev => prev - 1)
        }, 1000)
        
        return () => clearTimeout(timer)
      }
    }, [freeShippingApplied, countdown])
    
    if (!shouldApplyFreeShipping() || selectedShippingMethod?.id !== findFreeShippingMethod()?.id) {
      return null
    }
    
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 text-green-600">🎉</div>
          <Text className="text-sm text-green-700 font-medium">
            ¡Envío gratis aplicado! Tu pedido supera los 100€ y el destino es España.
            {freeShippingApplied && countdown > 0 && (
              <span className="block mt-1 text-xs">
                Continuando automáticamente en {countdown} segundos...
              </span>
            )}
          </Text>
        </div>
      </div>
    )
  }

  console.log("CARRITO", cart)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row font-archivoBlack text-2xl gap-x-2 font-bold items-baseline uppercase",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !cart.shipping_methods?.length,
            }
          )}
        >
          {t("checkout.delivery")}
          {!isOpen && !!((cart.shipping_methods?.length ?? 0) > 0) && (
            <CheckCircleSolid />
          )}
        </Heading>

        {!isOpen &&
          !!(cart.shipping_methods && cart.shipping_methods.length > 0) && (
            <Text>
              <button
                onClick={handleEdit}
                className="font-archivo text-sm hover:text-black/60"
                data-testid="edit-delivery-button"
              >
                Editar
              </button>
            </Text>
          )}
      </div>

      {isOpen ? (
        // Formulario activo
        <div data-testid="delivery-options-container">
          <div className="space-y-0">
            <RadioGroup value={selectedShippingMethod?.id} onChange={set}>
              {visibleShippingMethods?.map((option, index) => {
                const isSelected = option.id === selectedShippingMethod?.id
                const isFirst = index === 0
                const isLast = index === visibleShippingMethods.length - 1

                return (
                  <div key={option.id} className="relative">
                    <RadioGroup.Option
                      value={option.id}
                      data-testid="delivery-option-radio"
                      disabled={isLoading || pendingAutoSubmit}
                      className={clx(
                        "relative block w-full bg-white border border-[#e6e6e6] cursor-pointer transition-all duration-200",
                        {
                          // Bordes del acordeón
                          "rounded-t-lg border-b-0": isFirst,
                          "border-b-0": !isFirst && !isLast,
                          "rounded-b-lg": isLast,
                          // Estados de selección
                          "bg-gray-50 border-gray-400": isSelected,
                          "hover:bg-gray-50":
                            !isSelected && !isLoading && !pendingAutoSubmit,
                          // Estado deshabilitado
                          "cursor-not-allowed opacity-60":
                            isLoading || pendingAutoSubmit,
                        }
                      )}
                    >
                      <div className="p-4 font-archivo">
                        {/* Header de la opción */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4">
                              {isLoading && isSelected ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                              ) : (
                                <div
                                  className={clx(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    {
                                      "bg-gray-500": isSelected,
                                      "border-gray-230 bg-white": !isSelected,
                                    }
                                  )}
                                >
                                  {isSelected && (
                                    <div className="w-1 h-1 bg-black rounded-full"></div>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-gray-900">
                              {/* @ts-ignore */}
                              {option.translations?.name ? option.translations?.name : option.name}
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
                            {option.price_type === "calculated" &&
                              deliveryRange && (
                                <>
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">
                                      Tiempo producción:
                                    </span>{" "}
                                    <span className="font-semibold">
                                      {deliveryRange.minDays ===
                                      deliveryRange.maxDays
                                        ? `${deliveryRange.minDays} días`
                                        : `${deliveryRange.minDays}-${deliveryRange.maxDays} días`}
                                    </span>
                                  </div>

                                  <div className="text-sm text-gray-900 font-medium">
                                    Tu pedido llegará entre el{" "}
                                    <span className="font-black">
                                      {deliveryRange.startDate.toLocaleDateString(
                                        "es-ES",
                                        {
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                        }
                                      )}
                                    </span>
                                    {deliveryRange.minDays !==
                                      deliveryRange.maxDays && (
                                      <>
                                        {" y el "}
                                        <span className="font-black">
                                          {deliveryRange.endDate.toLocaleDateString(
                                            "es-ES",
                                            {
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric",
                                            }
                                          )}
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
                                {option.name.includes("Express") &&
                                  "1-2 días laborales"}
                                {option.name.includes("Standard") &&
                                  "3-5 días laborales"}
                                {option.name.includes("Recogida") &&
                                  "Disponible para recogida"}
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

          {/* ✅ NUEVO: Usar el componente FreeShippingMessage con countdown */}
          <FreeShippingMessage />

          {/* Mensaje de feedback cuando se está preparando el auto-submit */}
          {pendingAutoSubmit && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <Text className="text-sm text-blue-700">
                  ✅ Método de envío seleccionado - verificando y continuando al
                  pago...
                </Text>
              </div>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />
        </div>
      ) : (
        // Vista de resumen cuando el step está completado
        <div>
          <div className="text-small-regular">
            {(cart.shipping_methods?.length ?? 0) > 0 ? (
              <div className="flex items-start flex-col sm:flex-row gap-x-0 gap-y-8">
                <div
                  className="flex flex-col w-1/3"
                  data-testid="delivery-method-summary"
                >
                  <Text className="font-semibold font-archivo text-ui-fg-base mb-1">
                    Método de envío
                  </Text>
                  <Text className="txt-medium font-archivo text-ui-fg-subtle">
                    {selectedShippingMethod?.name || "Método seleccionado"}
                  </Text>
                  <Text className="txt-medium font-archivo text-ui-fg-subtle">
                    {selectedShippingMethod &&
                      getShippingOptionPrice(selectedShippingMethod)}
                  </Text>
                </div>

                {/* Mostrar información de entrega si es calculated */}
                {isCalculatedShippingSelected && deliveryRange && (
                  <div
                    className="flex flex-col w-1/3"
                    data-testid="delivery-estimate-summary"
                  >
                    <Text className="font-semibold font-archivo text-ui-fg-base mb-1">
                      Fecha estimada de entrega
                    </Text>
                    <Text className="txt-medium font-archivo text-ui-fg-subtle">
                      {deliveryRange.minDays === deliveryRange.maxDays
                        ? deliveryRange.startDate.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : `${deliveryRange.startDate.toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "short",
                            }
                          )} - ${deliveryRange.endDate.toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}`}
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              // Solo mostrar spinner si no hay shipping methods Y si hemos pasado por este step
              // (es decir, si el step actual es posterior a delivery o si estamos en delivery)
              <div>
                {searchParams.get("step") === "payment" ||
                searchParams.get("step") === "review" ||
                searchParams.get("step") === "delivery" ? (
                  <Spinner />
                ) : (
                  // Si aún no hemos llegado al step de delivery, no mostrar nada
                  <div className="text-gray-400 font-archivo text-base">
                    Completa la dirección de envío para continuar.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping