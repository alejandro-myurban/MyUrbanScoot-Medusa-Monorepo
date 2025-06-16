"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
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

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()

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

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const set = async (id: string) => {
    setIsLoading(true)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

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
            "flex flex-row font-semibold text-2xl gap-x-2 items-baseline uppercase font-dmSans",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          {t("checkout.delivery")}
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
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
          )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8 space-y-4">
            <RadioGroup value={selectedShippingMethod?.id} onChange={set}>
              {availableShippingMethods?.map((option) => {
                const isSelected = option.id === selectedShippingMethod?.id
                return (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "relative block w-full p-6 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200",
                      {
                        "border-black bg-white shadow-sm": isSelected,
                        "hover:border-gray-300 hover:bg-gray-100": !isSelected,
                      }
                    )}
                  >
                    <div className="flex items-start w-full justify-between">
                      <div className="flex items-start w-full gap-4">
                        <div className="flex items-center h-6">
                          <Radio checked={isSelected} />
                        </div>
                        <div className="flex-1 w-full">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {option.name}
                            </h4>
                            <span className="text-lg font-bold text-gray-900">
                              {getShippingOptionPrice(option)}
                            </span>
                          </div>

                          {/* Mostrar información de tiempo si es el método seleccionado y es calculated */}
                          {isSelected &&
                            option.price_type === "calculated" &&
                            deliveryRange && (
                              <div className="mt-3 space-y-2">
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">
                                    Tiempo producción:
                                  </span>{" "}
                                  {deliveryRange.minDays ===
                                  deliveryRange.maxDays
                                    ? `${deliveryRange.minDays} días`
                                    : `${deliveryRange.minDays}-${deliveryRange.maxDays} días`}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  Tu pedido llegará entre el{" "}
                                  <span className="font-bold">
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
                                      {" "}
                                      y el{" "}
                                      <span className="font-bold">
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
                                <div className="text-xs text-gray-500">
                                  si nadie la lía por el camino
                                </div>
                              </div>
                            )}

                          {/* Para métodos flat rate, mostrar descripción simple */}
                          {isSelected && option.price_type === "flat" && (
                            <div className="mt-2 text-sm text-gray-600">
                              {option.name.includes("Express") &&
                                "1-2 días laborales"}
                              {option.name.includes("Standard") &&
                                "3-5 días laborales"}
                              {option.name.includes("Recogida") &&
                                "Disponible para recogida"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </RadioGroup.Option>
                )
              })}
            </RadioGroup>
          </div>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!cart.shipping_methods?.[0]}
            data-testid="submit-delivery-option-button"
          >
            Continue to payment
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Method
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {selectedShippingMethod?.name}{" "}
                  {getShippingOptionPrice(selectedShippingMethod!)}
                </Text>
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
