"use client"

import { paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard} from "@medusajs/icons"
import { Button, Container, Heading, Text, clx, RadioGroup } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"
import Divider from "@modules/common/components/divider"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { StripePaymentElementChangeEvent } from "@stripe/stripe-js"
import { Mailbox } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripeComplete, setStripeComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [selectedProvider, setSelectedProvider] = useState<string>("")

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"
  const stripeReady = useContext(StripeContext)

  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )
  
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

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

  // Métodos de pago disponibles
  const paymentOptions = [
    {
      id: "stripe",
      provider_id: "pp_stripe_stripe",
      title: "Tarjeta de Crédito/Débito",
      description: "Paga con tarjeta de forma segura",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: "cod",
      provider_id: "pp_system_default", 
      title: "Contrareembolso",
      description: "Paga al recibir tu pedido",
      icon: <Mailbox className="w-5 h-5" />,
    }
  ]

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
      // Inicializar la sesión de pago para el provider seleccionado
      await initiatePaymentSession(cart, {
        provider_id: providerId,
      })
      console.log(`Sesión iniciada para provider: ${providerId}`)
    } catch (err: any) {
      console.error(`Error al inicializar sesión para ${providerId}:`, err)
      setError(`Error al inicializar el método de pago: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Si es Stripe, validar PaymentElement
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

      // Para contrareembolso, no necesitamos validaciones adicionales
      if (selectedProvider === "pp_system_default") {
        console.log("Método de contrareembolso seleccionado, continuando...")
      }

      // Continuar al siguiente paso
      router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Inicializar con el primer método disponible
  useEffect(() => {
    if (isOpen && !selectedProvider && paymentOptions.length > 0) {
      const defaultProvider = paymentOptions[0].provider_id
      setSelectedProvider(defaultProvider)
      handleProviderChange(defaultProvider)
    }
  }, [isOpen, selectedProvider])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Determinar si el botón debe estar habilitado
  const isButtonDisabled = () => {
    if (paidByGiftcard) return false
    if (!selectedProvider) return true
    if (selectedProvider === "pp_stripe_stripe") {
      return !stripeComplete || !stripe || !elements
    }
    if (selectedProvider === "pp_system_default") {
      return false // El contrareembolso siempre está listo
    }
    return true
  }

  const selectedOption = paymentOptions.find(opt => opt.provider_id === selectedProvider)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
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
                  className="grid gap-4"
                >
                  {paymentOptions.map((option) => (
                    <div
                      key={option.id}
                      className={clx(
                        "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors",
                        {
                          "border-ui-border-interactive bg-ui-bg-field-component": 
                            selectedProvider === option.provider_id,
                          "border-ui-border-base hover:border-ui-border-strong": 
                            selectedProvider !== option.provider_id,
                        }
                      )}
                      onClick={() => handleProviderChange(option.provider_id)}
                    >
                      <RadioGroup.Item
                        value={option.provider_id}
                        id={option.id}
                        className="shrink-0"
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

              {/* Stripe Payment Element */}
              {selectedProvider === "pp_stripe_stripe" && stripeReady && (
                <div className="mb-6 transition-all duration-150 ease-in-out">
                  <PaymentElement
                    onChange={handlePaymentElementChange}
                    options={{
                      layout: "tabs",
                    }}
                  />
                </div>
              )}

              {/* Información de contrareembolso */}
              {selectedProvider === "pp_system_default" && (
                <div className="mb-6 p-4 bg-ui-bg-subtle rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mailbox className="w-5 h-5 text-ui-fg-muted mt-0.5" />
                    <div>
                      <Text className="txt-medium-plus text-ui-fg-base mb-1">
                        Pago contra reembolso
                      </Text>
                      <Text className="txt-small text-ui-fg-subtle">
                        Pagarás el importe total al recibir tu pedido. 
                        El repartidor aceptará efectivo o tarjeta según disponibilidad.
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
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isButtonDisabled()}
            data-testid="submit-payment-button"
          >
            Continue to review
          </Button>
        </div>

        {/* Vista resumen cuando no está abierto */}
        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession && selectedOption ? (
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
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {selectedOption.icon}
                  </Container>
                  <Text>
                    {selectedProvider === "pp_stripe_stripe" 
                      ? "Another step will appear"
                      : "Pay on delivery"
                    }
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