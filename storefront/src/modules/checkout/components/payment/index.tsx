"use client"

import { paymentInfoMap } from "@lib/constants"
import {
  initiatePaymentSession,
  createPaymentCollection,
  retrieveCart,
} from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx, RadioGroup } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"
import Divider from "@modules/common/components/divider"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { StripePaymentElementChangeEvent } from "@stripe/stripe-js"
import { Mailbox } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"
import { useCodFee } from "../../../../lib/hooks/use-cod"
import { useTranslation } from "react-i18next"
import PayPal from "@modules/common/icons/paypal"
import PayPalPaymentButton from "../paypal-button"
import PayPalDebug from "../debug"

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
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        sessionStorage.getItem("selectedPaymentProvider") || "pp_stripe_stripe"
      )
    }
    return "pp_stripe_stripe"
  })

  const {
    handlePaymentProviderChange,
    isLoading: codLoading,
    error: codError,
  } = useCodFee({ cartId: cart.id })

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()

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
    const exceedsMaxAmount = cart.total > maxCODAmount
    return !exceedsMaxAmount && !isNonPeninsular
  }

  const hasCodFee = currentCart?.items?.some(
    (item: any) => item.metadata?.is_cod_fee === true
  )

  const getAllPaymentOptions = () => [
    {
      id: "stripe",
      provider_id: "pp_stripe_stripe",
      title: "Tarjeta de Crédito/Débito",
      description: "Paga con tarjeta de forma segura",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: "paypal",
      provider_id: "pp_paypal-payment_paypal-payment",
      title: "PayPal",
      description: "Paga con tu cuenta PayPal de forma segura",
      icon: <PayPal />,
    },
    {
      id: "cod",
      provider_id: "pp_system_default",
      title: "Contrareembolso",
      description: hasCodFee
        ? "Paga al recibir tu pedido (+5€ incluido)"
        : "Paga al recibir tu pedido (+5€)",
      icon: <Mailbox className="w-5 h-5" />,
    },
  ]

  const paymentOptions = getAllPaymentOptions().filter((option) => {
    if (option.provider_id === "pp_system_default") {
      return isCODAvailable()
    }
    return true
  })

  useEffect(() => {
    if (isOpen) {
      const isSelectedProviderAvailable = paymentOptions.some(
        (option) => option.provider_id === selectedProvider
      )

      if (!isSelectedProviderAvailable) {
        const newProvider = "pp_stripe_stripe"
        setSelectedProvider(newProvider)
        handleProviderChange(newProvider)
      } else if (!selectedProvider) {
        const savedProvider = sessionStorage.getItem("selectedPaymentProvider")
        const defaultProvider =
          savedProvider &&
          paymentOptions.some((opt) => opt.provider_id === savedProvider)
            ? savedProvider
            : paymentOptions[0]?.provider_id || "pp_stripe_stripe"
        setSelectedProvider(defaultProvider)
        handleProviderChange(defaultProvider)
      }
    }
  }, [isOpen, paymentOptions.length])

  useEffect(() => {
    setCurrentCart(cart)
  }, [cart])

  const activeSession = currentCart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  // 🔍 AGREGAR ESTE DEBUG AQUÍ
  console.log("=== PAYMENT SESSIONS DEBUG ===")
  console.log("Current cart:", currentCart)
  console.log("Payment collection:", currentCart?.payment_collection)
  console.log(
    "All payment sessions:",
    currentCart?.payment_collection?.payment_sessions?.map((s: any) => ({
      id: s.id,
      provider_id: s.provider_id,
      status: s.status,
      data: s.data,
    }))
  )
  console.log("Active session:", activeSession)
  console.log("Selected provider:", selectedProvider)
  console.log(
    "Available payment methods from backend:",
    availablePaymentMethods
  )
  console.log("========================")

  const paidByGiftcard =
    currentCart?.gift_cards &&
    currentCart?.gift_cards?.length > 0 &&
    currentCart?.total === 0

  const paymentReady =
    (activeSession && currentCart?.shipping_methods.length !== 0) ||
    paidByGiftcard

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
    }
  }

  const handleProviderChange = async (providerId: string) => {
    setSelectedProvider(providerId)
    setError(null)
    setIsLoading(true)

    try {
      console.log(`🔄 Iniciando sesión para provider: ${providerId}`)

      if (providerId === "pp_system_default") {
        console.log(`🔄 Manejando cargo COD para provider: ${providerId}`)
        const updatedCart = await handlePaymentProviderChange(providerId)

        if (updatedCart) {
          console.log("✅ Carrito actualizado con cargo COD:", updatedCart)
          setCurrentCart(updatedCart)
          if (onCartUpdate) {
            onCartUpdate(updatedCart)
          }
        } else if (codError) {
          throw new Error(codError)
        }
      } else {
        // Para Stripe y PayPal
        console.log(`🔄 Creando sesión de pago para ${providerId}`)

        await initiatePaymentSession(currentCart, {
          provider_id: providerId,
        })

        const updatedCart = await retrieveCart(currentCart.id)
        if (updatedCart) {
          setCurrentCart(updatedCart)
          if (onCartUpdate) {
            onCartUpdate(updatedCart)
          }
        }
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("selectedPaymentProvider", providerId)
      }

      console.log(`✅ Sesión iniciada exitosamente para ${providerId}`)
    } catch (err: any) {
      console.error(`❌ Error al inicializar sesión para ${providerId}:`, err)
      setError(`Error al inicializar el método de pago: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Para PayPal, no necesitamos hacer nada aquí ya que el PayPalPaymentButton maneja todo
      if (selectedProvider === "pp_paypal-payment_paypal-payment") {
        console.log("PayPal seleccionado - el botón PayPal manejará el flujo")
        setIsLoading(false)
        return
      }

      // Para Stripe
      if (selectedProvider === "pp_stripe_stripe") {
        if (!stripe || !elements) {
          setError("Procesamiento de pagos no disponible. Intenta de nuevo.")
          return
        }

        if (!stripeComplete) {
          setError("Por favor completa la información de pago.")
          return
        }

        const { error: submitError } = await elements.submit()
        if (submitError) {
          console.error("Error al enviar elements:", submitError)
          setError(submitError.message || "Error en la información de pago")
          return
        }
      }

      // Para contrareembolso y Stripe continuar al siguiente paso
      router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProvider && typeof window !== "undefined") {
      sessionStorage.setItem("selectedPaymentProvider", selectedProvider)
    }
  }, [selectedProvider])

  useEffect(() => {
    if (
      isOpen &&
      paymentOptions.length > 0 &&
      !currentCart.payment_collection
    ) {
      console.log("🔄 Creando payment collection inicial...")
      createPaymentCollection(currentCart.id)
        .then(async (result) => {
          console.log("✅ Payment collection creada:", result)

          const updatedCart = await retrieveCart(currentCart.id)
          if (updatedCart) {
            setCurrentCart(updatedCart)
          }

          if (!selectedProvider) {
            const defaultProvider = paymentOptions[0].provider_id
            setSelectedProvider(defaultProvider)
            handleProviderChange(defaultProvider)
          }
        })
        .catch((err) => {
          console.error("❌ Error creando payment collection:", err)
          setError("Error al inicializar el proceso de pago")
        })
    } else if (
      isOpen &&
      paymentOptions.length > 0 &&
      currentCart.payment_collection &&
      !selectedProvider
    ) {
      const defaultProvider = paymentOptions[0].provider_id
      setSelectedProvider(defaultProvider)
      handleProviderChange(defaultProvider)
    }
  }, [isOpen, currentCart.payment_collection, selectedProvider])

  const isButtonDisabled = (): boolean => {
    if (paidByGiftcard) return false
    if (!selectedProvider) return true
    if (codLoading) return true

    // Para PayPal, el botón principal se deshabilita porque PayPal maneja su propio flujo
    if (selectedProvider === "pp_paypal-payment_paypal-payment") {
      return true
    }

    if (selectedProvider === "pp_stripe_stripe") {
      return !stripeComplete || !stripe || !elements
    }

    if (selectedProvider === "pp_system_default") {
      return false
    }

    return true
  }

  const getButtonText = () => {
    if (codLoading) return "Procesando..."
    if (selectedProvider === "pp_paypal-payment_paypal-payment")
      return "Usa el botón PayPal de arriba"
    return "Continuar a revisión"
  }

  const selectedOption = paymentOptions.find(
    (opt) => opt.provider_id === selectedProvider
  )

  const displayError = error || codError

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        {process.env.NODE_ENV === "development" && (
          <PayPalDebug cart={currentCart} />
        )}
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-2xl font-semibold font-dmSans uppercase gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          {t("checkout.payment")}
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>

      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && (
            <>
              {/* Selector de métodos de pago */}
              <div className="mb-6">
                <Text className="txt-medium-plus text-ui-fg-base mb-4">
                  Selecciona un método de pago
                </Text>
                <RadioGroup
                  value={selectedProvider}
                  onValueChange={handleProviderChange}
                  className="grid gap-0"
                  disabled={codLoading}
                >
                  {paymentOptions.map((option) => (
                    <div
                      key={option.id}
                      className={clx(
                        "flex items-center space-x-3 border p-4 cursor-pointer transition-colors",
                        {
                          "border-ui-border-interactive bg-ui-bg-field-component":
                            selectedProvider === option.provider_id,
                          "border-ui-border-base hover:border-ui-border-strong":
                            selectedProvider !== option.provider_id,
                          "opacity-50 cursor-not-allowed": codLoading,
                        }
                      )}
                      onClick={() =>
                        !codLoading && handleProviderChange(option.provider_id)
                      }
                    >
                      <RadioGroup.Item
                        value={option.provider_id}
                        id={option.id}
                        className="shrink-0"
                        disabled={codLoading}
                      />
                      <Container className="flex items-center h-8 w-fit p-2 bg-ui-button-neutral-hover">
                        {option.icon}
                      </Container>
                      <div className="flex-1">
                        <Text className="txt-medium-plus text-ui-fg-base">
                          {option.title}
                        </Text>
                        <Text className="txt-small text-ui-fg-subtle">
                          {option.description}
                        </Text>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Notificación del cargo COD */}
              {selectedProvider === "pp_system_default" && hasCodFee && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Text className="txt-small text-green-700">
                    ✓ Se ha añadido el cargo por contra reembolso (5€) a tu
                    pedido
                  </Text>
                </div>
              )}

              {/* Stripe Payment Element */}
              {selectedProvider === "pp_stripe_stripe" && stripeReady && (
                <div className="mb-6 transition-all duration-150 ease-in-out">
                  <PaymentElement
                    onChange={handlePaymentElementChange}
                    options={{
                      layout: isMobile ? "accordion" : "tabs",
                    }}
                  />
                </div>
              )}

              {/* PayPal Payment Button - Componente mejorado */}
              {selectedProvider === "pp_paypal-payment_paypal-payment" && (
                <div className="mb-6 transition-all duration-150 ease-in-out">
                  <div className="p-4 bg-ui-bg-subtle rounded-lg mb-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      PayPal
                    </Text>
                    <Text className="txt-small text-ui-fg-subtle">
                      Haz clic en el botón de PayPal para autorizar el pago.
                      Después podrás revisar tu pedido antes de confirmarlo.
                    </Text>
                  </div>

                  <PayPalPaymentButton
                    cart={currentCart}
                    notReady={!paymentReady}
                    data-testid="paypal-payment-button"
                  />
                </div>
              )}

              {/* Información de contrareembolso */}
              {selectedProvider === "pp_system_default" && (
                <div className="mb-6 p-4 bg-ui-bg-subtle rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mailbox className="w-5 h-5 text-ui-fg-muted mt-0.5" />
                    <div className="flex-1">
                      <Text className="txt-medium-plus text-ui-fg-base mb-1">
                        Pago contra reembolso
                      </Text>
                      <Text className="txt-small text-ui-fg-subtle">
                        Pagarás el importe total al recibir tu pedido. El
                        repartidor aceptará efectivo o tarjeta según
                        disponibilidad. Se aplica un cargo adicional de 5€.
                      </Text>
                    </div>
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

          {/* Botón principal - se deshabilita para PayPal */}
          {selectedProvider !== "pp_paypal-payment_paypal-payment" && (
            <Button
              size="large"
              className="mt-6"
              onClick={handleSubmit}
              isLoading={isLoading || codLoading}
              disabled={isButtonDisabled()}
              data-testid="submit-payment-button"
            >
              {getButtonText()}
            </Button>
          )}

          {/* Mensaje informativo para PayPal */}
          {selectedProvider === "pp_paypal-payment_paypal-payment" && (
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Text className="txt-small text-blue-700 text-center">
                👆 Usa el botón de PayPal de arriba para continuar
              </Text>
            </div>
          )}
        </div>

        {/* Vista resumen cuando no está abierto */}
        <div className={isOpen ? "hidden" : "block"}>
          {currentCart && paymentReady && activeSession && selectedOption ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {selectedOption.title}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {selectedOption.icon}
                  </Container>
                  <Text>
                    {selectedProvider === "pp_stripe_stripe"
                      ? "Another step will appear"
                      : selectedProvider === "pp_paypal-payment_paypal-payment"
                      ? "Authorized with PayPal"
                      : "Pay on delivery"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
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
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
