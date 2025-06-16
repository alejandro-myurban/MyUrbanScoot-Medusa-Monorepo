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
  const [canMakePaymentStatus, setCanMakePaymentStatus] = useState<
    'first_load' | 'available' | 'unavailable'
  >('first_load')

  const isOpen =
    searchParams.get("step") === "address" ||
    searchParams.get("step") === "delivery"
  const [showButton, setShowButton] = useState<boolean>(false)
  const { t } = useTranslation()

  const stripeReady = useContext(StripeContext)
  const stripe = stripeReady ? useStripe() : null
  const elements = stripeReady ? useElements() : null

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  // Inicializar payment collection si no existe
  useEffect(() => {
    const initializePaymentCollection = async () => {
      if (cart && !cart.payment_collection && stripeReady) {
        try {
          console.log("🔄 Inicializando payment collection...")
          await createPaymentCollection(cart.id)
          console.log("✅ Payment collection creada")
        } catch (error) {
          console.error("❌ Error creando payment collection:", error)
          setExpressCheckoutError("Error inicializando ExpressCheckout")
        }
      }
    }

    initializePaymentCollection()
  }, [cart?.id, cart?.payment_collection, stripeReady])

  // Mapear opciones de envío al formato de Stripe
  const mapShippingRates = (shippingOptions: any[]) => {
    if (!shippingOptions?.length) {
      // Opciones por defecto si no hay ninguna
      return [
        {
          id: "standard",
          displayName: "Envío Estándar (3-5 días)",
          amount: 500, // €5.00 en centavos
        },
        {
          id: "express", 
          displayName: "Envío Express (1-2 días)",
          amount: 1500, // €15.00 en centavos
        },
      ]
    }

    return shippingOptions.map((option, index) => ({
      id: option.id ?? index.toString(),
      displayName: option.name ?? `Opción de envío ${index + 1}`,
      amount: Math.round((option.amount ?? 0) * 100), // Convertir a centavos
    }))
  }

  // Eventos del ExpressCheckoutElement
  const onReady = ({ availablePaymentMethods, ...rest }: any) => {
    console.log("🚀 ExpressCheckout ready:", { availablePaymentMethods, rest })
    
    if (!availablePaymentMethods) {
      setCanMakePaymentStatus('unavailable')
      return
    }

    setCanMakePaymentStatus('available')
  }

  const onClick = ({ resolve, expressPaymentType }: any) => {
    console.log("👆 ExpressCheckout clicked:", expressPaymentType)
    setExpressCheckoutLoading(true)
    
    const options = {
      emailRequired: true,
      shippingAddressRequired: true,
      billingAddressRequired: true,
      phoneNumberRequired: true,
      shippingRates: mapShippingRates([]), // Usar opciones por defecto
    }

    resolve(options)
  }

  const onConfirm = async (event: any) => {
    console.log("✅ ExpressCheckout confirm:", event)
    setExpressCheckoutLoading(true)
    setExpressCheckoutError(null)

    try {
      if (!stripe || !elements) {
        event.paymentFailed({ reason: 'fail' })
        setExpressCheckoutError("Stripe no está disponible")
        return
      }

      // Extraer datos del evento
      const payerNameSplit = (event.billingDetails?.name ?? event.shippingAddress?.name)?.split(' ')
      
      if (!payerNameSplit) {
        event.paymentFailed({ reason: 'fail' })
        setExpressCheckoutError("Por favor proporciona un nombre válido")
        return
      }

      // Construir direcciones
      const shippingAddress = {
        first_name: payerNameSplit[0] ?? '',
        last_name: payerNameSplit.slice(1).join(' ') ?? '',
        address_1: event.shippingAddress?.address?.line1 ?? '',
        address_2: event.shippingAddress?.address?.line2 ?? '',
        city: event.shippingAddress?.address?.city ?? '',
        province: event.shippingAddress?.address?.state ?? '',
        postal_code: event.shippingAddress?.address?.postal_code ?? '',
        country_code: event.shippingAddress?.address?.country?.toLowerCase() ?? '',
        phone: event.billingDetails?.phone ?? '',
      }

      const billingAddress = {
        first_name: payerNameSplit[0] ?? '',
        last_name: payerNameSplit.slice(1).join(' ') ?? '',
        address_1: event.billingDetails?.address?.line1 ?? '',
        address_2: event.billingDetails?.address?.line2 ?? '',
        city: event.billingDetails?.address?.city ?? '',
        province: event.billingDetails?.address?.state ?? '',
        postal_code: event.billingDetails?.address?.postal_code ?? '',
        country_code: event.billingDetails?.address?.country?.toLowerCase() ?? '',
        phone: event.billingDetails?.phone ?? '',
      }

      console.log("📍 Dirección de envío:", shippingAddress)
      console.log("💳 Dirección de facturación:", billingAddress)

      // Actualizar carrito con las direcciones
      const formData = new FormData()
      
      // Agregar datos de envío
      Object.entries(shippingAddress).forEach(([key, value]) => {
        formData.append(`shipping_address.${key}`, value as string)
      })
      
      // Agregar datos de facturación
      Object.entries(billingAddress).forEach(([key, value]) => {
        formData.append(`billing_address.${key}`, value as string)
      })
      
      formData.append('email', event.billingDetails?.email ?? cart?.email ?? '')
      formData.append('same_as_billing', 'false')

      // Actualizar direcciones
      await setAddresses(null, formData)

      console.log("✅ Direcciones actualizadas, redirigiendo...")
      
      // Redirigir al siguiente paso
      router.push(pathname + "?step=payment")
      
    } catch (error: any) {
      console.error("❌ Error en ExpressCheckout:", error)
      setExpressCheckoutError(error.message || "Error procesando el pago express")
      event.paymentFailed({ reason: 'fail' })
    } finally {
      setExpressCheckoutLoading(false)
    }
  }

  const onShippingAddressChange = async (event: any) => {
    console.log("📍 Cambio de dirección:", event.address)
    
    // Validar país (ejemplo: solo España y países UE)
    const allowedCountries = ["ES", "FR", "IT", "DE", "PT", "NL", "BE"]
    
    if (!allowedCountries.includes(event.address?.country)) {
      setExpressCheckoutError("No enviamos a este país")
      return event.reject()
    }

    // Resolver con las opciones de envío
    const resolveDetails = {
      shippingRates: mapShippingRates([])
    }

    return event.resolve(resolveDetails)
  }

  const onShippingRateChange = async (event: any) => {
    console.log("🚚 Cambio de tarifa de envío:", event.shippingRate)
    
    // Actualizar el total con el costo de envío
    if (elements && cart?.total) {
      const shippingAmount = event.shippingRate.amount
      const newTotal = Math.round(cart.total * 100) + shippingAmount
      
      elements.update({
        amount: newTotal,
      })
    }

    event.resolve()
  }

  const onCancel = () => {
    console.log("❌ ExpressCheckout cancelado")
    setExpressCheckoutLoading(false)
    setExpressCheckoutError(null)
  }

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

  // Skeleton mientras carga
  const ExpressCheckoutSkeleton = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="h-11 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-11 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  // Condiciones para mostrar ExpressCheckout
  const shouldShowExpressCheckout =
    stripeReady &&
    stripe !== null &&
    elements !== null &&
    cart &&
    cart.total &&
    cart.total > 0 &&
    cart.payment_collection &&
    (canMakePaymentStatus === 'available' || canMakePaymentStatus === 'first_load')

  return (
    <div className="bg-white">
      {/* Express Checkout */}
      {shouldShowExpressCheckout && (
        <div className="mb-6">
          <Heading level="h3" className="text-xl mb-4">
            Pago Express
          </Heading>

          {expressCheckoutError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <Text className="text-sm text-red-700">
                {expressCheckoutError}
              </Text>
            </div>
          )}

          <div className="py-4">
            {canMakePaymentStatus === 'first_load' && <ExpressCheckoutSkeleton />}

            <ExpressCheckoutElement
              options={{
                paymentMethodOrder: ['apple_pay', 'google_pay', 'link'],
                paymentMethods: {
                  applePay: 'always',
                  googlePay: 'always',
                  link: 'auto',
                  paypal: "never",
                  klarna: "never",
                  
                },
              }}
              onCancel={onCancel}
              onReady={onReady}
              onShippingAddressChange={onShippingAddressChange}
              onClick={onClick}
              onConfirm={onConfirm}
              onShippingRateChange={onShippingRateChange}
            />
          </div>

          {expressCheckoutLoading && (
            <div className="mt-3 flex items-center gap-2">
              <Spinner />
              <Text className="text-sm">Procesando pago express...</Text>
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