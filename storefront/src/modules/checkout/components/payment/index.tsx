"use client"

import { useCallback, useContext, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Text, clx } from "@medusajs/ui"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { StripePaymentElementChangeEvent } from "@stripe/stripe-js"

import Divider from "@modules/common/components/divider"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import { initiatePaymentSession } from "@lib/data/cart"

const Payment = ({
  cart,
}: {
  cart: any
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

  const stripeReady = useContext(StripeContext)
  const stripe = stripeReady ? useStripe() : null
  const elements = stripeReady ? useElements() : null

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
      await initiatePaymentSession(cart, {
        provider_id: "pp_stripe_stripe",
      })
    } catch (err) {
      console.error(err)
      setError("No se pudo iniciar Stripe. Intenta de nuevo.")
    }
  }

  useEffect(() => {
    if (!activeSession && isOpen) {
      initStripe()
    }
  }, [activeSession, isOpen, cart])

  useEffect(() => {
    setError(null)
  }, [isOpen, activeTab])

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
          setError("Stripe no está listo. Recarga la página e intenta de nuevo.")
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
    <div className="bg-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Text
          className={clx("text-2xl font-semibold", {
            "opacity-50": !isOpen || !paymentReady,
          })}
        >
          Métodos de pago
          {!isOpen && paymentReady && <CheckCircleSolid className="inline ml-2" />}
        </Text>
      </div>

      {/* Contenido del paso */}
      <div className={isOpen ? "block" : "hidden"}>
        <div className="space-y-4">
          {/* Pestaña Stripe */}
          <div className="border rounded-lg">
            <button
              type="button"
              className="w-full flex justify-between items-center px-4 py-3"
              onClick={() => setActiveTab("stripe")}
            >
              <span className="font-medium">Stripe (tarjeta y wallets)</span>
              <span className="text-xl">
                {activeTab === "stripe" ? "−" : "+"}
              </span>
            </button>
            {activeTab === "stripe" && (
              <div className="p-4">
                <PaymentElement
                  onChange={handlePaymentElementChange}
                  options={{ layout: "tabs" }}
                />
              </div>
            )}
          </div>

          {/* Pestaña Contra­reembolso */}
          <div className="border rounded-lg">
            <button
              type="button"
              className="w-full flex justify-between items-center px-4 py-3"
              onClick={() => setActiveTab("cash_on_delivery")}
            >
              <span className="font-medium">Contra­reembolso</span>
              <span className="text-xl">
                {activeTab === "cash_on_delivery" ? "−" : "+"}
              </span>
            </button>
            {activeTab === "cash_on_delivery" && (
              <div className="p-4">
                <Text>
                  Pagarás en efectivo al transportista en el momento de la entrega.
                </Text>
              </div>
            )}
          </div>
        </div>

        <ErrorMessage error={error} />

        <Button
          size="large"
          className="mt-6"
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={
            activeTab === "stripe"
              ? !stripeComplete
              : false
          }
        >
          Continuar
        </Button>
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
