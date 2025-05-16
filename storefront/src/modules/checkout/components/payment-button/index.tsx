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

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

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

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.provider_id === "pp_stripe_stripe"
  )

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    if (!stripe || !elements || !cart) {
      return
    }

    setSubmitting(true)
    setErrorMessage(null) // Limpiar errores anteriores

    try {
      // Agregar timeout para la operación
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("La operación ha tardado demasiado tiempo")),
          30000
        )
      )

      const clientSecret = paymentSession?.data?.client_secret as string

      if (!clientSecret) {
        console.error("No se encontró client_secret en la sesión de pago")
        setErrorMessage(
          "Error de configuración de pago. Por favor, intenta de nuevo."
        )
        setSubmitting(false)
        return
      }

      // Competir entre el timeout y la confirmación de pago
      const result = await Promise.race([
        stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/api/capture-payment/${cart.id}?country_code=${countryCode}`,
            payment_method_data: {
              billing_details: {
                name:
                  cart.billing_address?.first_name +
                  " " +
                  cart.billing_address?.last_name,
                address: {
                  city: cart.billing_address?.city ?? undefined,
                  country: cart.billing_address?.country_code ?? undefined,
                  line1: cart.billing_address?.address_1 ?? undefined,
                  line2: cart.billing_address?.address_2 ?? undefined,
                  postal_code: cart.billing_address?.postal_code ?? undefined,
                  state: cart.billing_address?.province ?? undefined,
                },
                email: cart.email,
                phone: cart.billing_address?.phone ?? undefined,
              },
            },
          },
          redirect: "if_required",
        }),
        timeoutPromise,
      ])

      // Manejar el resultado
      const { error } = result as { error?: any }
      if (error) {
        console.error("Error en confirmPayment de Stripe:", error)
        const pi = error.payment_intent

        if (
          (pi && pi.status === "requires_capture") ||
          (pi && pi.status === "succeeded")
        ) {
          onPaymentCompleted()
          return
        }

        setErrorMessage(error.message || "Error en el procesamiento del pago")
      } else {
        // Éxito sin error
        onPaymentCompleted()
      }
    } catch (err) {
      // Capturar cualquier error no manejado
      console.error("Error inesperado en el proceso de pago:", err)
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error inesperado durante el proceso de pago"
      )
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (cart.payment_collection?.status === "authorized") {
      onPaymentCompleted()
    }
  }, [cart.payment_collection?.status])

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
