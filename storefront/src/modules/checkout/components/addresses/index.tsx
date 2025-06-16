"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"

import { setAddresses, createPaymentCollection, setShippingMethod } from "@lib/data/cart"
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
import { listCartShippingMethods } from "@lib/data/fulfillment"

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
    console.log("🔄 Mapeando shipping options:", shippingOptions)
    
    if (!shippingOptions?.length) {
      // ⚠️ FALLBACK: Opciones hardcodeadas si no hay opciones reales
      console.log("⚠️ No hay shipping options reales, usando fallback")
      return [
        {
          id: "so_01standard", // Usar IDs que existan en tu Medusa
          displayName: "Envío Estándar (3-5 días)",
          amount: 500, // €5.00 en centavos
        },
        {
          id: "so_01express", // Usar IDs que existan en tu Medusa
          displayName: "Envío Express (1-2 días)",
          amount: 1500, // €15.00 en centavos
        },
      ]
    }

    // ✅ Mapear desde las opciones reales de Medusa
    const mappedRates = shippingOptions.map((option, index) => {
      console.log(`📦 Mapeando opción ${index}:`, option)
      
      return {
        id: option.id, // ✅ ID real de la shipping_option de Medusa
        displayName: option.name || `Opción de envío ${index + 1}`,
        amount: Math.round((option.amount || 0) * 100), // Convertir a centavos
      }
    })
    
    console.log("✅ Opciones mapeadas para Stripe:", mappedRates)
    return mappedRates
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
        console.error("❌ Stripe no disponible")
        event.paymentFailed({ reason: 'fail' })
        setExpressCheckoutError("Stripe no está disponible")
        return
      }

      // Extraer datos del evento correctamente
      const payerNameSplit = (event.billingDetails?.name ?? event.shippingAddress?.name)?.split(' ') || []
      
      if (payerNameSplit.length === 0) {
        console.error("❌ No se encontró nombre")
        event.paymentFailed({ reason: 'fail' })
        setExpressCheckoutError("Por favor proporciona un nombre válido")
        return
      }

      // Construir dirección de envío desde shippingAddress
      const shippingAddress = {
        first_name: payerNameSplit[0] || '',
        last_name: payerNameSplit.slice(1).join(' ') || '',
        address_1: event.shippingAddress?.address?.line1 || '',
        address_2: event.shippingAddress?.address?.line2 || '',
        city: event.shippingAddress?.address?.city || '',
        province: event.shippingAddress?.address?.state || '',
        postal_code: event.shippingAddress?.address?.postal_code || '',
        country_code: event.shippingAddress?.address?.country?.toLowerCase() || '',
        phone: event.billingDetails?.phone || '',
      }

      // Construir dirección de facturación desde billingDetails
      const billingAddress = {
        first_name: payerNameSplit[0] || '',
        last_name: payerNameSplit.slice(1).join(' ') || '',
        address_1: event.billingDetails?.address?.line1 || '',
        address_2: event.billingDetails?.address?.line2 || '',
        city: event.billingDetails?.address?.city || '',
        province: event.billingDetails?.address?.state || '',
        postal_code: event.billingDetails?.address?.postal_code || '',
        country_code: event.billingDetails?.address?.country?.toLowerCase() || '',
        phone: event.billingDetails?.phone || '',
      }

      console.log("📍 Dirección de envío:", shippingAddress)
      console.log("💳 Dirección de facturación:", billingAddress)

      // Crear FormData con la estructura exacta que espera setAddresses
      const formData = new FormData()
      
      // Email
      formData.append('email', event.billingDetails?.email ?? cart?.email ?? '')
      
      // Shipping address - formato exacto que espera la función
      formData.append('shipping_address.first_name', shippingAddress.first_name)
      formData.append('shipping_address.last_name', shippingAddress.last_name)
      formData.append('shipping_address.address_1', shippingAddress.address_1)
      formData.append('shipping_address.company', '') // Campo requerido aunque esté vacío
      formData.append('shipping_address.postal_code', shippingAddress.postal_code)
      formData.append('shipping_address.city', shippingAddress.city)
      formData.append('shipping_address.country_code', shippingAddress.country_code)
      formData.append('shipping_address.province', shippingAddress.province)
      formData.append('shipping_address.phone', shippingAddress.phone)
      
      // Billing address
      formData.append('billing_address.first_name', billingAddress.first_name)
      formData.append('billing_address.last_name', billingAddress.last_name)
      formData.append('billing_address.address_1', billingAddress.address_1)
      formData.append('billing_address.company', '') // Campo requerido aunque esté vacío
      formData.append('billing_address.postal_code', billingAddress.postal_code)
      formData.append('billing_address.city', billingAddress.city)
      formData.append('billing_address.country_code', billingAddress.country_code)
      formData.append('billing_address.province', billingAddress.province)
      formData.append('billing_address.phone', billingAddress.phone)
      
      // ✅ NO incluir same_as_billing para que use direcciones separadas
      // La función detecta automáticamente si no está "on"
      
      console.log("📦 FormData preparado para setAddresses:")
      Array.from(formData.keys()).forEach(key => {
        console.log(`${key}: ${formData.get(key)}`)
      })

      // Actualizar direcciones en el carrito
      const result = await setAddresses(null, formData)
      
      console.log("🔄 Resultado de setAddresses:", result)

      // Verificar si hubo errores
      if (result && typeof result === 'string') {
        throw new Error(result)
      }

      console.log("✅ Direcciones actualizadas correctamente")
      
      // 🚚 IMPORTANTE: Ahora guardar también el método de envío seleccionado
      const selectedShippingRate = event.shippingRate
      console.log("🚚 Método de envío seleccionado:", selectedShippingRate)
      
      if (selectedShippingRate && cart?.id) {
        try {
          console.log("💾 Guardando método de envío en Medusa...")
          console.log("- Cart ID:", cart.id)
          console.log("- Shipping Option ID:", selectedShippingRate.id)
          
          await setShippingMethod({
            cartId: cart.id,
            shippingMethodId: selectedShippingRate.id
          })
          
          console.log("✅ Método de envío guardado correctamente")
          
          // Ahora redirigir directamente a payment saltando delivery
          const country = shippingAddress.country_code
          window.location.href = `/${country}/checkout?step=review`
          
        } catch (shippingError) {
          console.error("❌ Error guardando método de envío:", shippingError)
          // Si falla, ir al paso de delivery para que elija manualmente
          console.log("⚠️ Redirigiendo a delivery para selección manual")
        }
      } else {
        console.log("⚠️ No hay método de envío seleccionado, ir a delivery")
      }
      
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
    
    try {
      // Validar país (ejemplo: solo España y países UE + Reino Unido para testing)
      const allowedCountries = ["ES", "FR", "IT", "DE", "PT", "NL", "BE", "GB", "US", "AU"]
      
      if (!allowedCountries.includes(event.address?.country)) {
        console.log("❌ País no permitido:", event.address?.country)
        setExpressCheckoutError("No enviamos a este país")
        return event.reject({
          reason: 'shipping_address_invalid'
        })
      }

      // 🔄 Actualizar el carrito temporalmente con la nueva dirección 
      // para obtener las opciones de envío reales
      const tempAddress = {
        first_name: "temp",
        last_name: "temp", 
        address_1: event.address.line1 || "",
        company: "",
        postal_code: event.address.postal_code || "",
        city: event.address.city || "",
        country_code: event.address.country?.toLowerCase() || "",
        province: event.address.state || "",
        phone: "temp",
      }

      let realShippingOptions: any[] = []

      try {
        // Actualizar temporalmente para obtener shipping options
        const tempFormData = new FormData()
        tempFormData.append('email', cart?.email || 'temp@temp.com')
        Object.entries(tempAddress).forEach(([key, value]) => {
          tempFormData.append(`shipping_address.${key}`, value as string)
        })
        
        console.log("🔄 Actualizando dirección temporal para obtener shipping options...")
        await setAddresses(null, tempFormData)
        
        // 🚚 Obtener las opciones de envío reales después de actualizar la dirección
        if (cart?.id) {
          console.log("📦 Obteniendo shipping options para cart:", cart.id)
          realShippingOptions = await listCartShippingMethods(cart.id) || []
          console.log("🚚 Shipping options obtenidas de Medusa:", realShippingOptions)
        }
        
      } catch (tempError) {
        console.log("⚠️ Error actualizando dirección temporal:", tempError)
        console.log("Usando opciones por defecto...")
      }

      // Obtener opciones de envío (reales si están disponibles, sino hardcodeadas)
      const shippingRates = mapShippingRates(realShippingOptions)
      console.log("🚚 Opciones de envío mapeadas para Stripe:", shippingRates)

      // Verificar que hay opciones disponibles
      if (!shippingRates.length) {
        console.log("❌ No hay opciones de envío disponibles para esta dirección")
        setExpressCheckoutError("No hay métodos de envío disponibles para esta dirección")
        return event.reject({
          reason: 'shipping_address_unserviceable'
        })
      }

      // También actualizar el total inicial con la primera opción de envío
      if (elements && cart?.total && shippingRates.length > 0) {
        const cartTotalInCents = Math.round(cart.total * 100)
        const firstShippingRate = shippingRates[0].amount
        const totalWithShipping = cartTotalInCents + firstShippingRate
        
        console.log("💰 Actualizando total inicial con envío:")
        console.log("- Cart total:", cartTotalInCents, "centavos")
        console.log("- First shipping:", firstShippingRate, "centavos")
        console.log("- Total with shipping:", totalWithShipping, "centavos")
        
        elements.update({
          amount: totalWithShipping,
        })
      }

      // Resolver con las opciones de envío
      const resolveDetails = {
        shippingRates: shippingRates
      }

      console.log("✅ Resolviendo cambio de dirección con:", resolveDetails)
      return event.resolve(resolveDetails)
      
    } catch (error) {
      console.error("❌ Error en onShippingAddressChange:", error)
      return event.reject({
        reason: 'shipping_address_invalid'
      })
    }
  }

  const onShippingRateChange = async (event: any) => {
    console.log("🚚 Cambio de tarifa de envío:", event.shippingRate)
    
    try {
      // Actualizar el total con el costo de envío
      if (elements && cart?.total) {
        const shippingAmount = event.shippingRate.amount
        const cartTotalInCents = Math.round(cart.total * 100)
        const newTotal = cartTotalInCents + shippingAmount
        
        console.log("💰 Cálculo del total:")
        console.log("- Cart total:", cart.total, "€ =", cartTotalInCents, "centavos")
        console.log("- Shipping cost:", shippingAmount, "centavos")
        console.log("- New total:", newTotal, "centavos")
        
        elements.update({
          amount: newTotal,
        })
      }

      console.log("✅ Resolviendo cambio de tarifa de envío")
      event.resolve()
      
    } catch (error) {
      console.error("❌ Error en onShippingRateChange:", error)
      event.reject()
    }
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