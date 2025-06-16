"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"

import { setAddresses, createPaymentCollection } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useFormState } from "react-dom"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"
import { useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const formRef = useRef<HTMLFormElement>(null)
  const [submitCount, setSubmitCount] = useState(0)
  const [expressCheckoutLoading, setExpressCheckoutLoading] = useState(false)
  const [expressCheckoutError, setExpressCheckoutError] = useState<
    string | null
  >(null)

  const isOpen =
    searchParams.get("step") === "address" ||
    searchParams.get("step") === "delivery"
  const [showButton, setShowButton] = useState<boolean>(false)
  const { t } = useTranslation()

  // Usar la misma lógica que Payment
  const stripeReady = useContext(StripeContext)
  const stripe = stripeReady ? useStripe() : null
  const elements = stripeReady ? useElements() : null

  // Debug adicional para diagnosticar el problema
  useEffect(() => {
    console.log("🔍 Diagnóstico detallado de Stripe:")
    console.log("- StripeContext ready:", stripeReady)
    console.log("- useStripe() result:", stripe)
    console.log("- useElements() result:", elements)
    console.log(
      "- Stripe loading state:",
      stripe === null ? "loading" : "ready"
    )
    console.log(
      "- Elements loading state:",
      elements === null ? "loading" : "ready"
    )
  }, [stripeReady, stripe, elements])

  // Debug logs más detallados
  useEffect(() => {
    console.log("=== DEBUG ADDRESSES EXPRESS CHECKOUT ===")
    console.log("stripeReady:", stripeReady)
    console.log("stripe initialized:", !!stripe)
    console.log("elements initialized:", !!elements)
    console.log("cart exists:", !!cart)
    console.log("cart total:", cart?.total)
    console.log("payment collection exists:", !!cart?.payment_collection)
    console.log(
      "payment sessions:",
      cart?.payment_collection?.payment_sessions?.length || 0
    )
    console.log(
      "shipping address complete:",
      !!cart?.shipping_address?.address_1
    )
    console.log("==========================================")
  }, [stripeReady, stripe, elements, cart])

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  // Inicializar payment collection si no existe (necesario para ExpressCheckout)
  useEffect(() => {
    const initializePaymentCollection = async () => {
      if (cart && !cart.payment_collection && stripeReady) {
        try {
          console.log(
            "🔄 Inicializando payment collection para ExpressCheckout..."
          )
          await createPaymentCollection(cart.id)
          console.log("✅ Payment collection creada para ExpressCheckout")
        } catch (error) {
          console.error("❌ Error creando payment collection:", error)
          setExpressCheckoutError("Error inicializando ExpressCheckout")
        }
      }
    }

    initializePaymentCollection()
  }, [cart?.id, cart?.payment_collection, stripeReady])

  useEffect(() => {
    const form = formRef.current
    if (!form) return

    const onBlur = (e: Event) => {
      const tgt = e.target as HTMLInputElement
      if (tgt.name === "email") {
        form.requestSubmit()

        const timer = setTimeout(() => {
          setShowButton(true)
        }, 5000)

        return () => clearTimeout(timer)
      }
    }

    form.addEventListener("blur", onBlur, true)

    return () => {
      form.removeEventListener("blur", onBlur, true)
    }
  }, [formRef])

  const [message, formAction] = useFormState(setAddresses, null)

  const handleSubmit = (formData: FormData) => {
    setSubmitCount((prev) => prev + 1)
    return formAction(formData)
  }

  // Configuración optimizada para ExpressCheckout
  const expressCheckoutOptions = {
    buttonType: {
      googlePay: "checkout" as const,
      applePay: "check-out" as const,
    },
    buttonTheme: {
      googlePay: "black" as const,
      applePay: "black" as const,
    },
    buttonHeight: 48,
    paymentMethods: {
      googlePay: "always" as const,
      applePay: "always" as const,
      link: "never" as const,
      amazonPay: "never" as const,
      paypal: "never" as const,
      klarna: "never" as const,
    },
    // Configuración específica para el paso de dirección
    layout: {
      overflow: "never" as const,
      maxColumns: 1,
      maxRows: 1,
    },
  }

  const handleExpressCheckout = async (event: any) => {
    setExpressCheckoutLoading(true)
    setExpressCheckoutError(null)

    try {
      console.log("🚀 Iniciando ExpressCheckout desde Addresses:", event)

      // Verificar que tenemos todo lo necesario
      if (!stripe || !elements) {
        throw new Error("Stripe no está disponible")
      }

      // El ExpressCheckout maneja automáticamente la dirección de envío
      // Aquí podrías agregar lógica adicional si necesitas validar algo específico

      console.log("✅ ExpressCheckout completado, redirigiendo a review...")
      router.push(pathname + "?step=review")
    } catch (error: any) {
      console.error("❌ Error en ExpressCheckout:", error)
      setExpressCheckoutError(
        error.message || "Error procesando el pago express"
      )
    } finally {
      setExpressCheckoutLoading(false)
    }
  }

  // Condiciones más específicas para mostrar ExpressCheckout
  const shouldShowExpressCheckout =
    stripeReady &&
    stripe !== null && // Stripe puede ser null mientras carga
    elements !== null && // Elements puede ser null mientras carga
    cart &&
    cart.total &&
    cart.total > 0 &&
    cart.payment_collection && // Necesario para que funcione
    !expressCheckoutLoading

  // Mensaje de debug más informativo
  const getDebugMessage = () => {
    const checks = [
      { name: "Stripe Ready", value: stripeReady },
      { name: "Stripe", value: stripe !== null ? "ready" : "null/loading" },
      { name: "Elements", value: elements !== null ? "ready" : "null/loading" },
      { name: "Cart", value: !!cart },
      { name: "Total > 0", value: cart && cart.total > 0 },
      { name: "Payment Collection", value: !!cart?.payment_collection },
    ]

    return checks.map((check) => `${check.name}: ${check.value}`).join(", ")
  }

  return (
    <div className="bg-white">
      {/* Express Checkout Element */}
      {shouldShowExpressCheckout ? (
        <div className="mb-6">
          <ExpressCheckoutElement
            className="mt-4"
            options={expressCheckoutOptions}
            onConfirm={handleExpressCheckout}
          />

          {expressCheckoutError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
              <Text className="text-sm text-red-700">
                {expressCheckoutError}
              </Text>
            </div>
          )}

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">
              O completa manualmente
            </span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-white border border-blue-200 rounded">
          {expressCheckoutLoading && (
            <div className="mt-2 flex items-center gap-2">
              <Spinner />
              <span className="text-sm">Inicializando pago express...</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          {t("checkout.shipping_address")}
          {!isOpen && <CheckCircleSolid />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-address-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>

      {isOpen ? (
        <form ref={formRef} action={handleSubmit} key={submitCount}>
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  className="text-3xl-regular gap-x-4 pb-6 pt-8"
                >
                  Billing address
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            {showButton && (
              <SubmitButton
                className="mt-6"
                data-testid="submit-address-button"
              >
                Actualizar datos
              </SubmitButton>
            )}
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="flex items-start gap-x-8">
                <div className="flex items-start gap-x-1 w-full">
                  <div
                    className="flex flex-col w-1/3"
                    data-testid="shipping-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Shipping Address
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </Text>
                  </div>

                  <div
                    className="flex flex-col w-1/3 "
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Contact
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.phone}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.email}
                    </Text>
                  </div>

                  <div
                    className="flex flex-col w-1/3"
                    data-testid="billing-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Billing Address
                    </Text>

                    {sameAsBilling ? (
                      <Text className="txt-medium text-ui-fg-subtle">
                        Billing- and delivery address are the same.
                      </Text>
                    ) : (
                      <>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.first_name}{" "}
                          {cart.billing_address?.last_name}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.address_1}{" "}
                          {cart.billing_address?.address_2}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.postal_code},{" "}
                          {cart.billing_address?.city}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.country_code?.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
