"use client"

import { paymentInfoMap } from "@lib/constants"
import {
  initiatePaymentSession,
  createPaymentCollection,
  retrieveCart,
  placeOrder,
} from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"
import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { StripePaymentElementChangeEvent } from "@stripe/stripe-js"
import { Mailbox } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"
import { useCodFee } from "../../../../lib/hooks/use-cod"
import { useTranslation } from "react-i18next"
import { TermsCheckbox } from "../terms-checkbox"

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)")
    setIsMobile(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return isMobile
}

const Payment = ({
  cart,
  availablePaymentMethods,
  onCartUpdate,
}: {
  cart: any
  availablePaymentMethods: any[]
  onCartUpdate?: (cart: any) => void
}) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripeComplete, setStripeComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [currentCart, setCurrentCart] = useState(cart)
  const [selectedProvider, setSelectedProvider] =
    useState<string>("pp_stripe_stripe")
  const [processingOrder, setProcessingOrder] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const {
    handlePaymentProviderChange,
    isLoading: codLoading,
    error: codError,
  } = useCodFee({ cartId: cart.id })

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Determinar si este step está activo
  const isOpen = searchParams.get("step") === "payment"
  const stripeReady = useContext(StripeContext)

  // Provincias no peninsulares
  const NON_PENINSULAR_PROVINCES = [
    "Illes Balears",
    "Baleares",
    "Islas Baleares",
    "Las Palmas",
    "Santa Cruz de Tenerife",
    "Canarias",
    "Islas Canarias",
    "Ceuta",
    "Melilla",
    "Ibiza",
    "Formentera",
    "Gran Canaria",
    "Tenerife",
    "Lanzarote",
    "Fuerteventura",
    "La Palma",
    "La Gomera",
    "El Hierro",
    "La Graciosa",
    "Mallorca",
    "Menorca",
  ]

  const isNonPeninsularProvince = (province: string): boolean => {
    if (!province) return false
    const normalizedProvince = province.toLowerCase().trim()
    if (normalizedProvince.length <= 2) return false

    return NON_PENINSULAR_PROVINCES.some(
      (nonPeninsularProvince) =>
        normalizedProvince.includes(nonPeninsularProvince.toLowerCase()) ||
        nonPeninsularProvince.toLowerCase().includes(normalizedProvince)
    )
  }

  const isCODAvailable = (): boolean => {
    const maxCODAmount = 100
    const isNonPeninsular = isNonPeninsularProvince(
      cart?.billing_address?.province || ""
    )
    const exceedsMaxAmount = cart.item_subtotal > maxCODAmount
    return !exceedsMaxAmount && !isNonPeninsular
  }

  const hasCodFee = currentCart?.items?.some(
    (item: any) => item.metadata?.is_cod_fee === true
  )

  useEffect(() => {
    setCurrentCart(cart)
  }, [cart])

  const activeSession = currentCart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const paidByGiftcard =
    currentCart?.gift_cards &&
    currentCart?.gift_cards?.length > 0 &&
    currentCart?.total === 0

  const paymentReady =
    (activeSession && currentCart?.shipping_methods.length !== 0) ||
    paidByGiftcard

  const isReadyForPayment = useCallback(() => {
    const previousStepsCompleted =
      currentCart?.shipping_address && currentCart?.shipping_methods?.length > 0

    if (!previousStepsCompleted) {
      return false
    }

    if (selectedProvider === "pp_stripe_stripe") {
      return stripeComplete && stripe && elements
    }

    if (selectedProvider === "pp_system_default") {
      // Simplificamos la condición: solo necesitamos que no esté cargando
      // y que COD esté disponible (que ya se verificó al mostrar la opción)
      return !codLoading && !isLoading
    }

    return false
  }, [currentCart, selectedProvider, stripeComplete, codLoading, isLoading])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const navigateToNextStep = () => {
    router.push(pathname + "?step=review", { scroll: false })
  }

  const stripe = stripeReady ? useStripe() : null
  const elements = stripeReady ? useElements() : null

  const handlePaymentElementChange = async (
    event: StripePaymentElementChangeEvent
  ) => {
    if (event.value.type) {
      setSelectedPaymentMethod(event.value.type)
    }
    setStripeComplete(event.complete)

    if (event.complete) {
      setError(null)
      setSelectedProvider("pp_stripe_stripe")
      console.log("✅ Stripe payment element completado")
    }
  }

  const handleCODSelection = async () => {
    if (selectedProvider === "pp_system_default") {
      // Si ya está seleccionado COD, no hacer nada
      return
    }

    console.log("🔄 Seleccionando COD...")
    setSelectedProvider("pp_system_default")
    setError(null)
    setIsLoading(true)
    setStripeComplete(false)

    try {
      console.log("🔄 Iniciando sesión para COD...")

      const updatedCartResponse = await handlePaymentProviderChange(
        "pp_system_default"
      )

      if (updatedCartResponse) {
        console.log(
          "✅ Carrito actualizado con cargo COD:",
          updatedCartResponse
        )

        const fullCart = await retrieveCart(currentCart.id)
        if (fullCart) {
          setCurrentCart(fullCart)
          if (onCartUpdate) {
            onCartUpdate(fullCart)
          }

          console.log("🔄 Creando payment session DESPUÉS del COD fee...")
          await initiatePaymentSession(fullCart, {
            provider_id: "pp_system_default",
          })
        }
      } else if (codError) {
        throw new Error(codError)
      }

      const finalCart = await retrieveCart(currentCart.id)
      if (finalCart) {
        setCurrentCart(finalCart)
        if (onCartUpdate) {
          onCartUpdate(finalCart)
        }
      }

      console.log("✅ Sesión COD configurada - botón habilitado")
    } catch (err: any) {
      console.error("❌ Error al inicializar sesión COD:", err)
      setError(`Error al inicializar el método de pago: ${err.message}`)
      // Revertir el provider si hay error
      setSelectedProvider("pp_stripe_stripe")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelCOD = async () => {
    setSelectedProvider("pp_stripe_stripe")
    setError(null)
    setIsLoading(true)
    setStripeComplete(false)

    try {
      console.log("🔄 Cancelando COD y volviendo a Stripe...")

      // Si hay cargo COD, lo removemos
      if (hasCodFee) {
        const updatedCartResponse = await handlePaymentProviderChange(
          "pp_stripe_stripe"
        )

        if (updatedCartResponse) {
          console.log(
            "✅ Carrito actualizado sin cargo COD:",
            updatedCartResponse
          )

          const fullCart = await retrieveCart(currentCart.id)
          if (fullCart) {
            setCurrentCart(fullCart)
            if (onCartUpdate) {
              onCartUpdate(fullCart)
            }
          }
        }
      }

      // Reiniciar sesión de Stripe
      await initiatePaymentSession(currentCart, {
        provider_id: "pp_stripe_stripe",
      })

      console.log("✅ Vuelto a Stripe exitosamente")
    } catch (err: any) {
      console.error("❌ Error al cancelar COD:", err)
      setError(`Error al cambiar método de pago: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!isReadyForPayment()) {
      setError("Por favor completa toda la información de pago")
      return
    }

    setProcessingOrder(true)
    setError(null)

    try {
      if (selectedProvider === "pp_stripe_stripe") {
        if (!stripe || !elements) {
          throw new Error("Stripe no está disponible")
        }

        console.log("💳 Confirmando pago con Stripe...")
        const { error: submitError } = await elements.submit()
        if (submitError) {
          throw new Error(
            submitError.message || "Error en la información de pago"
          )
        }

        const clientSecret = activeSession?.data?.client_secret
        if (!clientSecret) {
          throw new Error("No se encontró client_secret")
        }

        const baseUrl = window.location.origin
        const returnUrl = `${baseUrl}/api/capture-payment/${currentCart.id}`

        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: returnUrl,
          },
          redirect: "if_required",
        })

        if (confirmError) {
          throw new Error(confirmError.message || "Error confirmando el pago")
        }

        console.log("✅ Pago confirmado con Stripe")
      }

      console.log("📝 Colocando orden...")
      await placeOrder(currentCart.id)

      console.log("✅ Orden colocada exitosamente - redirección automática")
    } catch (err: any) {
      console.error("❌ Error procesando el pedido:", err)
      setError(err.message || "Error procesando el pedido")
    } finally {
      setProcessingOrder(false)
    }
  }

  useEffect(() => {
    if (isOpen && !currentCart.payment_collection) {
      console.log("🔄 Creando payment collection inicial...")
      createPaymentCollection(currentCart.id)
        .then(async (result) => {
          console.log("✅ Payment collection creada:", result)

          const updatedCart = await retrieveCart(currentCart.id)
          if (updatedCart) {
            setCurrentCart(updatedCart)
          }

          // Inicializar Stripe por defecto
          await initiatePaymentSession(currentCart, {
            provider_id: "pp_stripe_stripe",
          })
        })
        .catch((err) => {
          console.error("❌ Error creando payment collection:", err)
          setError("Error al inicializar el proceso de pago")
        })
    }
  }, [isOpen, currentCart.payment_collection])

  const isButtonDisabled = (): boolean => {
    if (paidByGiftcard) return false
    if (!selectedProvider) return true
    if (codLoading || processingOrder || isLoading) return true

    return !isReadyForPayment()
  }

  const getButtonText = () => {
    if (processingOrder) return "Procesando pedido..."
    if (codLoading || isLoading) return "Procesando..."
    if (selectedProvider === "pp_stripe_stripe" && !stripeComplete)
      return "Completa tu pago"
    if (selectedProvider === "pp_system_default") {
      // Debug: mostrar el estado
      console.log("COD button state:", {
        codLoading,
        isLoading,
        isReady: isReadyForPayment(),
        selectedProvider,
      })
      return "Confirmar pedido (COD)"
    }
    return "PAGAR"
  }

  const displayError = error || codError

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <div className="flex flex-col items-start justify-start gap-2">
          <Heading
            level="h2"
            className={clx(
              "flex flex-row text-2xl font-semibold font-archivoBlack uppercase gap-x-2 items-baseline",
              {
                "opacity-50 pointer-events-none select-none":
                  !isOpen && !paymentReady,
              }
            )}
          >
            {t("checkout.payment")}
            {!isOpen && paymentReady && <CheckCircleSolid />}
          </Heading>
          {isOpen && (
            <p className="text-gray-400 font-archivo">
              {t("checkout.safe_payment")}
            </p>
          )}
        </div>

        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="font-archivo text-sm hover:text-black/60"
              data-testid="edit-payment-button"
            >
              Editar
            </button>
          </Text>
        )}
      </div>

      {isOpen ? (
        // Formulario activo
        <div>
          {!paidByGiftcard && (
            <>
              {/* Mensaje de procesamiento */}
              {processingOrder && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <Text className="txt-medium-plus text-blue-800">
                        🎉 Procesando tu pedido...
                      </Text>
                      <Text className="txt-small text-blue-600">
                        Confirmando pago y creando tu orden. Te redirigiremos en
                        un momento.
                      </Text>
                    </div>
                  </div>
                </div>
              )}

              {/* Stripe Payment Element - Sin modificaciones, usa sus propios tabs */}
              {stripeReady && (
                <div className="mb-4 transition-all duration-150 ease-in-out">
                  <PaymentElement
                    onChange={handlePaymentElementChange}
                    options={{
                      layout: "accordion",
                      wallets: {
                        applePay: "never",
                        googlePay: "never",
                      },
                    }}
                  />
                </div>
              )}

              {/* Tab personalizado para COD que imita el estilo de Stripe */}
              {isCODAvailable() && (
                <div className="mb-6">
                  {/* Container principal con borde y box-shadow */}
                  <div className="border border-[#e6e6e6] rounded-lg overflow-hidden bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)]">
                    {/* Tab header */}
                    <div
                      className={clx(
                        "flex items-center justify-between p-4 cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50",
                        {
                          "bg-blue-50 border-blue-200":
                            selectedProvider === "pp_system_default",
                          "bg-white": selectedProvider !== "pp_system_default",
                        }
                      )}
                      onClick={handleCODSelection}
                    >
                      <div className="group flex items-center justify-between w-full hover:bg-gray-50/50 rounded-lg transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-5">
                          <Mailbox className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-[400] text-[#6d6e78] font-archivo antialiased leading-[16.1px] group-hover:text-black/80 transition-colors duration-200">
                            Contrareembolso
                          </span>
                        </div>
                        <span className="font-medium text-sm text-[#6d6e78] font-archivo antialiased leading-[16.1px] group-hover:text-black/80 transition-colors duration-200">
                          {hasCodFee ? "+5,00€" : "+5,00€"}
                        </span>
                      </div>
                    </div>

                    {/* Contenido del tab COD cuando está seleccionado */}
                    {selectedProvider === "pp_system_default" && (
                      <div className="p-4 bg-gray-50">
                        {/* Notificación del cargo COD */}
                        {hasCodFee && (
                          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Text className="text-sm text-green-700">
                              ✓ Se ha añadido el cargo por contra reembolso (5€)
                              a tu pedido
                            </Text>
                          </div>
                        )}

                        {/* Información de contrareembolso */}
                        <div className="text-sm mb-4 font-archivo text-gray-600">
                          <p className="mb-2">
                            Pagarás el importe total al recibir tu pedido.
                          </p>
                          <p className="text-xs font-archivo text-gray-500">
                            El repartidor aceptará efectivo o tarjeta según
                            disponibilidad. Se aplica un cargo adicional de 5€.
                          </p>
                        </div>

                        {/* Botón para cancelar COD */}
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={handleCancelCOD}
                          disabled={isLoading || codLoading}
                          className="w-full p-2 bg-red-50 font-archivo font-bold uppercase"
                        >
                          {isLoading
                            ? "Cambiando..."
                            : "Cancelar contrareembolso"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={displayError}
            data-testid="payment-method-error-message"
          />

          <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} />

          {/* Botón principal para procesar el pago */}
          <Button
            size="large"
            className="mt-6 w-full h-11 lg:w-2/5 font-archivoBlack text-xl"
            onClick={handleSubmit}
            isLoading={isLoading || codLoading || processingOrder}
            disabled={isButtonDisabled() || !termsAccepted}
            data-testid="submit-payment-button"
          >
            {getButtonText()}
          </Button>
        </div>
      ) : (
        // Vista de resumen cuando el step está completado
        <div>
          <div className="text-small-regular">
            {paymentReady && activeSession ? (
              <div className="flex items-start gap-x-8">
                <div
                  className="flex flex-col w-1/2"
                  data-testid="payment-method-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Método de pago
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {selectedProvider === "pp_stripe_stripe"
                      ? "Tarjeta de Crédito/Débito"
                      : "Contrareembolso"}
                  </Text>
                  {selectedProvider === "pp_system_default" && hasCodFee && (
                    <Text className="txt-small text-ui-fg-subtle">
                      Cargo COD: +5,00€
                    </Text>
                  )}
                </div>

                <div
                  className="flex flex-col w-1/2"
                  data-testid="payment-status-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Estado
                  </Text>
                  <div className="flex items-center gap-2">
                    <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                      {selectedProvider === "pp_stripe_stripe" ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Mailbox className="w-4 h-4" />
                      )}
                    </Container>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {selectedProvider === "pp_stripe_stripe"
                        ? "Listo para pagar"
                        : "Pago contra reembolso"}
                    </Text>
                  </div>
                </div>
              </div>
            ) : paidByGiftcard ? (
              <div className="flex flex-col w-1/2">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Método de pago
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  Gift card
                </Text>
              </div>
            ) : (
              // Solo mostrar spinner/mensaje si estamos en steps posteriores o en payment
              <div>
                {searchParams.get("step") === "review" ||
                searchParams.get("step") === "payment" ? (
                  <Spinner />
                ) : (
                  // Si aún no hemos llegado al step de payment, mostrar mensaje
                  <div className="text-gray-400 font-archivo text-base">
                    Completa los pasos anteriores para configurar el pago.
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

export default Payment
