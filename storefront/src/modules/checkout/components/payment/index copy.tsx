"use client"

import { useCallback, useContext, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import PayPal from "@modules/common/icons/paypal"
import { Button, Text, clx, Container } from "@medusajs/ui"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { StripePaymentElementChangeEvent } from "@stripe/stripe-js"

import Divider from "@modules/common/components/divider"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import { initiatePaymentSession } from "@lib/data/cart"
import { deletePaymentSessions } from "@lib/data/payment"
import { StoreCart, StorePaymentProvider } from "@medusajs/types"
import { paymentInfoMap } from "@lib/constants"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Ideal from "@modules/common/icons/ideal"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: StoreCart
  availablePaymentMethods: StorePaymentProvider[]
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // ---- Estados ----
  // Controla qué panel del acordeón está abierto
  const [activeTab, setActiveTab] = useState<"stripe" | "cash_on_delivery">(
    "stripe"
  )
  // Datos que devuelve Stripe tras completar el PaymentElement
  const [stripeMethodType, setStripeMethodType] = useState<string>()
  const [stripeComplete, setStripeComplete] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpen = searchParams.get("step") === "payment"
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (ps: any) => ps.status === "pending"
  )
  const paymentReady = !!activeSession

  // Solo inicializamos Stripe si el método de pago es Stripe
  const isStripePayment = activeSession?.provider_id?.startsWith("pp_stripe_")
  const stripeReady = isStripePayment ? useContext(StripeContext) : false
  const stripe = stripeReady ? useStripe() : null
  const elements = stripeReady ? useElements() : null

  console.log("Debug Payment Component:", {
    stripeReady,
    elements,
    stripe,
    isOpen,
    paymentReady,
    activeSession,
    providerId: activeSession?.provider_id,
    paymentInfo: activeSession?.provider_id
      ? paymentInfoMap[activeSession.provider_id]
      : null,
    isStripePayment,
  })

  const createQS = useCallback(
    (name: string, value: string) => {
      const p = new URLSearchParams(searchParams)
      p.set(name, value)
      return p.toString()
    },
    [searchParams]
  )

  // Cuando el usuario interactúa con la UI de Stripe
  const handlePaymentElementChange = (e: StripePaymentElementChangeEvent) => {
    if (e.value.type) {
      setStripeMethodType(e.value.type)
    }
    setStripeComplete(e.complete)
    if (e.complete) {
      setError(null)
    }
  }

  // Inicia la sesión de Stripe si no existe
  const initStripe = async () => {
    try {
      console.log("Iniciando sesión de Stripe...")
      await initiatePaymentSession(cart, {
        provider_id: "pp_stripe_stripe",
      })
      console.log("Sesión de Stripe iniciada correctamente")
    } catch (err) {
      console.error("Error al iniciar sesión de Stripe:", err)
      setError("No se pudo iniciar Stripe. Intenta de nuevo.")
    }
  }

  const handlePaymentMethodChange = async (value: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Si hay una sesión activa, la cancelamos primero
      if (activeSession) {
        await deletePaymentSessions([activeSession.id])
      }

      // Iniciamos la nueva sesión
      if (value === "pp_system_default") {
        await initiatePaymentSession(cart, {
          provider_id: "pp_system_default",
        })
        setActiveTab("cash_on_delivery")
      } else {
        // Para Stripe, primero iniciamos la sesión y luego esperamos a que se inicialice
        await initiatePaymentSession(cart, {
          provider_id: "pp_stripe_stripe",
        })
        // Esperamos un momento para que se inicialice Stripe
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setActiveTab("stripe")
      }
    } catch (err) {
      console.error("Error al cambiar método de pago:", err)
      setError("No se pudo cambiar el método de pago. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!activeSession && isOpen) {
      initStripe()
    }
  }, [activeSession, isOpen, cart])

  // Efecto para manejar la inicialización de Stripe cuando cambia el método de pago
  useEffect(() => {
    if (activeSession?.provider_id?.startsWith("pp_stripe_")) {
      initStripe()
    }
  }, [activeSession?.provider_id])

  useEffect(() => {
    setError(null)
  }, [isOpen, activeTab])

  // Función para obtener la información de pago correcta
  const getPaymentInfo = (stripeMethodType: string) => {
    if (!stripeMethodType) {
      return {
        title: "Contrareembolso",
        icon: <FastDelivery />,
      }
    }
    // Si es PayPal a través de Stripe, usar la información de PayPal
    if (stripeMethodType === "paypal") {
      return {
        title: "PayPal",
        icon: <PayPal />,
      }
    }
    if (stripeMethodType === "bancontact") {
      return {
        title: "Bancontact",
        icon: <Ideal />,
      }
    }
    // Para otros métodos, usar el paymentInfoMap
    return {
      title: "Tarjeta de crédito",
      icon: <CreditCard />,
    }
  }

  // Envío del formulario
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (activeTab === "cash_on_delivery") {
        // Contra­reembolso
        await initiatePaymentSession(cart, {
          provider_id: "pp_system_default",
        })
      } else {
        // Stripe
        if (!stripe || !elements) {
          setError(
            "Stripe no está listo. Recarga la página e intenta de nuevo."
          )
          return
        }
        if (!stripeComplete) {
          setError("Completa los datos de tu tarjeta antes de continuar.")
          return
        }
        await elements.submit()
      }

      router.push(pathname + "?" + createQS("step", "review"), {
        scroll: false,
      })
    } catch (err: any) {
      setError(err.message || "Error procesando el pago")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Text
          className={clx("text-3xl font-semibold", {
            "opacity-100": !isOpen || !paymentReady,
          })}
        >
          Métodos de pago
          {!isOpen && paymentReady && (
            <CheckCircleSolid className="inline ml-2" />
          )}
        </Text>
        {!isOpen && paymentReady && (
          <Button
            variant="transparent"
            onClick={() =>
              router.push(pathname + "?" + createQS("step", "payment"))
            }
          >
            Editar
          </Button>
        )}
      </div>

      {/* Contenido del paso cuando está abierto */}
      {isOpen && (
        <div className="space-y-4">
          {/* Pestaña Stripe */}
          <div className="border rounded-lg">
            <button
              type="button"
              className="w-full flex justify-between items-center px-4 py-3"
              onClick={() => handlePaymentMethodChange("pp_stripe_stripe")}
            >
              <span className="font-medium">Stripe (tarjeta y wallets)</span>
              <span className="text-xl">
                {activeTab === "stripe" ? "−" : "+"}
              </span>
            </button>
            {activeTab === "stripe" && (
              <div className="p-4">
                {stripeReady && stripe && elements ? (
                  <PaymentElement
                    onChange={handlePaymentElementChange}
                    options={{ layout: "tabs" }}
                  />
                ) : (
                  <Text>Inicializando el sistema de pago...</Text>
                )}
              </div>
            )}
          </div>

          {/* Pestaña Contra­reembolso */}
          <div className="border rounded-lg">
            <button
              type="button"
              className="w-full flex justify-between items-center px-4 py-3"
              onClick={() => handlePaymentMethodChange("pp_system_default")}
            >
              <span className="font-medium">Contra­reembolso</span>
              <span className="text-xl">
                {activeTab === "cash_on_delivery" ? "−" : "+"}
              </span>
            </button>
            {activeTab === "cash_on_delivery" && (
              <div className="p-4">
                <Text>
                  Pagarás en efectivo al transportista en el momento de la
                  entrega.
                </Text>
              </div>
            )}
          </div>

          <ErrorMessage error={error} />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={activeTab === "stripe" ? !stripeComplete : false}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* Resumen del método de pago cuando NO está abierto pero hay una sesión activa */}
      {!isOpen && paymentReady && activeSession && (
        <div className="flex flex-wrap items-start gap-x-6 w-full mt-4">
          <div className="flex flex-col w-1/3">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Método de pago
            </Text>
            <Text
              className="txt-medium text-ui-fg-subtle flex gap-2"
              data-testid="payment-method-summary"
            >
              {getPaymentInfo(stripeMethodType!).title}
              <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                {getPaymentInfo(stripeMethodType!).icon}
              </Container>
            </Text>
          </div>
          <div className="flex flex-col w-1/3">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Detalles del pago
            </Text>

            <div
              className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
              data-testid="payment-details-summary"
            >
              <Text>
                {activeSession.provider_id === "pp_system_default"
                  ? "Pago contrareembolso"
                  : getPaymentInfo(activeSession.provider_id).title}
              </Text>
            </div>
          </div>
        </div>
      )}

      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
