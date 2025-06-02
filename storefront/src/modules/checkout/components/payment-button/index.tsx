"use client"

import { isStripe } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  // Buscar la sesión de pago activa (pending)
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending"
  )

  // Determinar qué componente de pago mostrar
  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case paymentSession?.provider_id === "pp_system_default":
      return (
        <CashOnDeliveryButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

// Componente para Contrareembolso
const CashOnDeliveryButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCashOnDeliveryOrder = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      console.log("Procesando orden con contrareembolso...")
      await placeOrder()
      console.log("Orden de contrareembolso completada exitosamente")
    } catch (err: any) {
      console.error("Error al procesar la orden de contrareembolso:", err)
      setErrorMessage(err.message || "Error al procesar la orden")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting}
        onClick={handleCashOnDeliveryOrder}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        {submitting ? "Procesando..." : "Confirmar pedido"}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="cod-payment-error-message"
      />
    </>
  )
}

// Componente para Stripe (tu código anterior mejorado)
const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { countryCode } = useParams()
  const stripe = useStripe()
  const elements = useElements()

  // Buscar la sesión de pago de Stripe
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.provider_id === "pp_stripe_stripe" && session.status === "pending"
  )

  const onPaymentCompleted = async () => {
    try {
      console.log("Procesando orden de Stripe...")
      await placeOrder()
      console.log("Orden de Stripe completada exitosamente")
    } catch (err: any) {
      console.error("Error al procesar la orden de Stripe:", err)
      setErrorMessage(err.message || "Error al procesar la orden")
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = !stripe || !elements || notReady || submitting

  const handlePayment = async () => {
    // Validaciones iniciales
    if (!stripe || !elements || !cart) {
      console.error("Stripe, elements o cart no disponibles")
      setErrorMessage("Servicio de pago no disponible. Intenta de nuevo.")
      return
    }

    if (!paymentSession?.data?.client_secret) {
      console.error("Client secret no disponible:", paymentSession)
      setErrorMessage("Sesión de pago no válida. Recarga la página.")
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const clientSecret = paymentSession.data.client_secret as string
      console.log("Iniciando confirmación de pago con Stripe...")

      // Primero, verificar si el PaymentElement está completo
      const { error: submitError } = await elements.submit()
      if (submitError) {
        console.error("Error al enviar elements:", submitError)
        setErrorMessage(submitError.message || "Error en la información de pago")
        setSubmitting(false)
        return
      }

      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/api/capture-payment/${cart.id}?country_code=${countryCode}`,
          payment_method_data: {
            billing_details: {
              name: cart.billing_address?.first_name && cart.billing_address?.last_name 
                ? `${cart.billing_address.first_name} ${cart.billing_address.last_name}`
                : undefined,
              address: {
                city: cart.billing_address?.city || undefined,
                country: cart.billing_address?.country_code || undefined,
                line1: cart.billing_address?.address_1 || undefined,
                line2: cart.billing_address?.address_2 || undefined,
                postal_code: cart.billing_address?.postal_code || undefined,
                state: cart.billing_address?.province || undefined,
              },
              email: cart.email || undefined,
              phone: cart.billing_address?.phone || undefined,
            },
          },
        },
        redirect: "if_required",
      })

      console.log("Resultado de confirmPayment:", result)

      if (result.error) {
        console.error("Error en confirmPayment:", result.error)
        
        const pi = result.error.payment_intent

        // Verificar si el pago fue exitoso a pesar del error
        if (pi && (pi.status === "requires_capture" || pi.status === "succeeded")) {
          console.log("Pago exitoso a pesar del error, completando orden...")
          await onPaymentCompleted()
        } else {
          setErrorMessage(result.error.message || "Error al procesar el pago")
          setSubmitting(false)
        }
      } else if (result.paymentIntent) {
        console.log("PaymentIntent exitoso:", result.paymentIntent.status)
        
        // Verificar el estado del PaymentIntent
        if (result.paymentIntent.status === "succeeded" || 
            result.paymentIntent.status === "requires_capture") {
          await onPaymentCompleted()
        } else {
          console.log("Estado del pago no esperado:", result.paymentIntent.status)
          setErrorMessage("El pago no se completó correctamente")
          setSubmitting(false)
        }
      } else {
        console.log("No se recibió PaymentIntent, verificando estado de la colección...")
        // Fallback: verificar el estado de la colección de pagos
        setTimeout(() => {
          if (cart.payment_collection?.status === "authorized") {
            onPaymentCompleted()
          } else {
            setErrorMessage("No se pudo confirmar el estado del pago")
            setSubmitting(false)
          }
        }, 2000)
      }

    } catch (error: any) {
      console.error("Error inesperado en handlePayment:", error)
      setErrorMessage(error.message || "Error inesperado al procesar el pago")
      setSubmitting(false)
    }
  }

  // Efecto para verificar el estado autorizado
  useEffect(() => {
    if (cart.payment_collection?.status === "authorized" && !submitting) {
      console.log("Pago ya autorizado, completando orden...")
      onPaymentCompleted()
    }
  }, [cart.payment_collection?.status])

  return (
    <>
      <Button
        disabled={disabled}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        {submitting ? "Procesando..." : "Place order"}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

export default PaymentButton