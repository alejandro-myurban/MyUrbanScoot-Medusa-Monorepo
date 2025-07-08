"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"

import {
  setAddresses,
  createPaymentCollection,
  setShippingMethod,
  placeOrder,
  initiatePaymentSession,
} from "@lib/data/cart"
import { sdk } from "@lib/config"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useFormState } from "react-dom"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
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
  const [isFormComplete, setIsFormComplete] = useState(false)
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false)
  const [expressCheckoutLoading, setExpressCheckoutLoading] = useState(false)
  const [expressCheckoutError, setExpressCheckoutError] = useState<
    string | null
  >(null)
  const [expressCheckoutElementMounted, setExpressCheckoutElementMounted] =
    useState(false)
  const [canMakePaymentStatus, setCanMakePaymentStatus] = useState<
    "first_load" | "available" | "unavailable"
  >("first_load")

  const [showButton, setShowButton] = useState<boolean>(false)
  const { t } = useTranslation()

  // Determinar si este step está activo
  const isOpen = searchParams.get("step") === "address"

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

  const navigateToNextStep = () => {
    router.push(pathname + "?step=delivery")
  }

  const validateFormCompleteness = useCallback(() => {
    const form = formRef.current
    if (!form) {
      console.log("❌ No hay referencia al formulario")
      return false
    }

    const requiredFields = [
      "email",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.city",
      "shipping_address.postal_code",
      "shipping_address.country_code",
      "shipping_address.phone",
    ]

    // Si billing address es diferente, validar también esos campos
    if (!sameAsBilling) {
      requiredFields.push(
        "billing_address.first_name",
        "billing_address.last_name",
        "billing_address.address_1",
        "billing_address.city",
        "billing_address.postal_code",
        "billing_address.country_code"
      )
    }

    let allValid = true
    const missingFields: string[] = []

    for (const fieldName of requiredFields) {
      const field = form.querySelector(
        `[name="${fieldName}"]`
      ) as HTMLInputElement
      if (!field || !field.value?.trim()) {
        allValid = false
        missingFields.push(fieldName)
      }
    }

    console.log("🔍 Validación formulario:", {
      allValid,
      missingFields,
      sameAsBilling,
      totalRequired: requiredFields.length,
    })

    return allValid
  }, [sameAsBilling])

  useEffect(() => {
    if (!formRef.current) return

    const handleFormChange = () => {
      const isComplete = validateFormCompleteness()
      setIsFormComplete(isComplete)

      // Auto-submit cuando esté completo y no se haya hecho ya
      if (isComplete && !hasAutoSubmitted) {
        console.log("✅ Formulario completo - haciendo auto-submit")
        setHasAutoSubmitted(true)

        // Pequeño delay para asegurar que los valores estén actualizados
        setTimeout(() => {
          formRef.current?.requestSubmit()
        }, 100)
      }

      // Reset del flag si el formulario se vuelve incompleto
      if (!isComplete && hasAutoSubmitted) {
        setHasAutoSubmitted(false)
      }
    }

    // Obtener todos los inputs del formulario
    const form = formRef.current
    const inputs = form.querySelectorAll("input, select")

    // Agregar listeners
    inputs.forEach((input) => {
      input.addEventListener("input", handleFormChange)
      input.addEventListener("change", handleFormChange)
    })

    // Cleanup
    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("input", handleFormChange)
        input.removeEventListener("change", handleFormChange)
      })
    }
  }, [validateFormCompleteness, hasAutoSubmitted])

  // Estado para cachear las shipping options
  const [cachedShippingOptions, setCachedShippingOptions] = useState<any[]>([])

  // Precargar shipping options cuando el carrito esté disponible
  useEffect(() => {
    const preloadShippingOptions = async () => {
      if (cart?.id && cart?.shipping_address) {
        try {
          console.log(
            "🔄 Precargando shipping options para carrito con dirección..."
          )
          const options = await listCartShippingMethods(cart.id)
          if (options && options.length > 0) {
            console.log("✅ Shipping options precargadas:", options)
            setCachedShippingOptions(options)
          }
        } catch (error) {
          console.log("⚠️ Error precargando shipping options:", error)
        }
      }
    }

    preloadShippingOptions()
  }, [cart?.id, cart?.shipping_address])

  // Limpiar estado al desmontar el componente
  useEffect(() => {
    return () => {
      setExpressCheckoutElementMounted(false)
      setCanMakePaymentStatus("first_load")
    }
  }, [])

  // Inicializar payment collection si no existe
  useEffect(() => {
    const initializePaymentCollection = async () => {
      if (cart && !cart.payment_collection && stripeReady) {
        try {
          console.log("🔄 Inicializando payment collection...")
          if (!cart?.id) {
            throw new Error("Cart is not available")
          }
          if (!cart?.id) {
            throw new Error("Cart is not available")
          }
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

  // Función para calcular precios de métodos calculated
  const calculateShippingPrices = async (
    shippingOptions: any[],
    cartId: string
  ) => {
    const calculatedOptions = shippingOptions.filter(
      (option) => option.price_type === "calculated"
    )

    if (!calculatedOptions.length) {
      console.log("📦 No hay opciones de tipo 'calculated' para calcular")
      return {}
    }

    console.log(
      `🧮 Calculando precios para ${calculatedOptions.length} opciones calculated...`
    )

    try {
      const promises = calculatedOptions.map((option) => {
        console.log(`💰 Calculando precio para: ${option.name} (${option.id})`)
        return sdk.store.fulfillment.calculate(option.id, {
          cart_id: cartId,
          data: {},
        })
      })

      const results = await Promise.allSettled(promises)
      const pricesMap: Record<string, number> = {}

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const optionId = result.value?.shipping_option?.id
          const amount = result.value?.shipping_option?.amount
          if (optionId && amount !== undefined) {
            pricesMap[optionId] = amount
            console.log(
              `✅ Precio calculado para ${calculatedOptions[index].name}: ${amount}€`
            )
          }
        } else {
          console.log(
            `❌ Error calculando precio para ${calculatedOptions[index].name}:`,
            result.reason
          )
        }
      })

      console.log("💰 Mapa de precios calculados final:", pricesMap)
      return pricesMap
    } catch (error) {
      console.error("❌ Error general calculando precios:", error)
      return {}
    }
  }

  // Mapear opciones de envío al formato de Stripe
  const mapShippingRates = async (shippingOptions: any[], cartId?: string) => {
    console.log("🔄 Mapeando shipping options:", shippingOptions)

    if (!shippingOptions?.length) {
      // ⚠️ FALLBACK: Opciones hardcodeadas si no hay opciones reales
      console.log("⚠️ No hay shipping options reales, usando fallback")
      return [
        {
          id: "so_01standard",
          displayName: "Envío Estándar (3-5 días)",
          amount: 500, // €5.00 en centavos
        },
        {
          id: "so_01express",
          displayName: "Envío Express (1-2 días)",
          amount: 1500, // €15.00 en centavos
        },
      ]
    }

    // ✅ Calcular precios para opciones de tipo "calculated"
    let calculatedPrices: Record<string, number> = {}
    if (cartId) {
      console.log("🧮 Iniciando cálculo de precios para opciones calculated...")
      calculatedPrices = await calculateShippingPrices(shippingOptions, cartId)
    } else {
      console.log("⚠️ No hay cartId, no se pueden calcular precios dinámicos")
    }

    // ✅ Mapear desde las opciones reales de Medusa
    const mappedRates = shippingOptions.map((option, index) => {
      console.log(`📦 Mapeando opción ${index}:`, option)

      // Obtener el precio correcto según el tipo
      let amountInCents = 0

      if (option.price_type === "flat") {
        // Para precios fijos, usar calculated_price.calculated_amount
        amountInCents = Math.round(
          (option.calculated_price?.calculated_amount || 0) * 100
        )
        console.log(
          `💰 Precio fijo: ${
            option.calculated_price?.calculated_amount || 0
          } € = ${amountInCents} centavos`
        )
      } else if (option.price_type === "calculated") {
        // ✅ Usar el precio calculado dinámicamente
        const calculatedAmount = calculatedPrices[option.id]
        if (calculatedAmount !== undefined) {
          amountInCents = Math.round(calculatedAmount * 100)
          console.log(
            `💰 Precio calculado dinámicamente: ${calculatedAmount} € = ${amountInCents} centavos`
          )
        } else {
          // Fallback si no se pudo calcular
          amountInCents = 599 // €5.99 por defecto
          console.log(
            `⚠️ No se pudo calcular precio para ${option.name}, usando fallback: ${amountInCents} centavos`
          )
        }
      }

      const mappedOption = {
        id: option.id,
        displayName: option.name || `Opción de envío ${index + 1}`,
        amount: amountInCents,
      }

      console.log(`✅ Opción mapeada:`, mappedOption)
      return mappedOption
    })

    console.log("✅ Todas las opciones mapeadas para Stripe:", mappedRates)
    return mappedRates
  }

  // Eventos del ExpressCheckoutElement
  const onReady = ({ availablePaymentMethods, ...rest }: any) => {
    console.log("🚀 ExpressCheckout ready:", {
      availablePaymentMethods,
      rest,
    })

    // Simplemente logear, no cambiar estados que puedan desmontar el componente
    if (availablePaymentMethods) {
      console.log("✅ Métodos de pago disponibles")
    } else {
      console.log("⚠️ No hay métodos de pago disponibles")
    }
  }

  const onClick = async ({ resolve, expressPaymentType }: any) => {
    console.log("👆 ExpressCheckout clicked:", expressPaymentType)
    console.log("🔍 Datos del carrito disponibles:", {
      cartId: cart?.id,
      hasCart: !!cart,
    })

    // ✅ ESTRATEGIA: Usar opciones con IDs reales pero precios estimados inicialmente
    const initialShippingRates = [
      {
        id: "so_01JSP4QGQKEBFDVJGDVQV8T04T", // ID real de "Recogida en tienda"
        displayName: "Recogida en tienda",
        amount: 0, // Gratis
      },
      {
        id: "so_01JVSHQH3JF956B9A4JFZGAMEP", // ID real de "Envío a domicilio"
        displayName: "Envío a domicilio",
        amount: 599, // €5.99 estimado
      },
    ]

    const options = {
      emailRequired: true,
      shippingAddressRequired: true,
      billingAddressRequired: true,
      phoneNumberRequired: true,
      shippingRates: initialShippingRates,
    }

    console.log(
      "📋 Opciones iniciales enviadas a Google Pay (con IDs reales):",
      options
    )
    console.log("📋 Número de shipping rates:", options.shippingRates.length)

    // ✅ Resolver inmediatamente con opciones predefinidas
    resolve(options)
    setExpressCheckoutLoading(true)
  }

  const onConfirm = async (event: any) => {
    console.log("✅ ExpressCheckout confirm:", event)
    setExpressCheckoutLoading(true)
    setExpressCheckoutError(null)

    try {
      if (!stripe || !elements) {
        console.error("❌ Stripe no disponible")
        event.paymentFailed({ reason: "fail" })
        setExpressCheckoutError("Stripe no está disponible")
        return
      }

      // Extraer datos del evento
      const payerNameSplit =
        (event.billingDetails?.name ?? event.shippingAddress?.name)?.split(
          " "
        ) || []

      if (payerNameSplit.length === 0) {
        console.error("❌ No se encontró nombre")
        event.paymentFailed({ reason: "fail" })
        setExpressCheckoutError("Por favor proporciona un nombre válido")
        return
      }

      // Construir direcciones (mismo código que tienes)
      const shippingAddress = {
        first_name: payerNameSplit[0] || "",
        last_name: payerNameSplit.slice(1).join(" ") || "",
        address_1: event.shippingAddress?.address?.line1 || "",
        address_2: event.shippingAddress?.address?.line2 || "",
        city: event.shippingAddress?.address?.city || "",
        province: event.shippingAddress?.address?.state || "",
        postal_code: event.shippingAddress?.address?.postal_code || "",
        country_code:
          event.shippingAddress?.address?.country?.toLowerCase() || "",
        phone: event.billingDetails?.phone || "",
      }

      const billingAddress = {
        first_name: payerNameSplit[0] || "",
        last_name: payerNameSplit.slice(1).join(" ") || "",
        address_1: event.billingDetails?.address?.line1 || "",
        address_2: event.billingDetails?.address?.line2 || "",
        city: event.billingDetails?.address?.city || "",
        province: event.billingDetails?.address?.state || "",
        postal_code: event.billingDetails?.address?.postal_code || "",
        country_code:
          event.billingDetails?.address?.country?.toLowerCase() || "",
        phone: event.billingDetails?.phone || "",
      }

      // Crear FormData para setAddresses
      const formData = new FormData()
      formData.append("email", event.billingDetails?.email ?? cart?.email ?? "")

      // Shipping address - usando la estructura exacta que espera setAddresses
      formData.append("shipping_address.first_name", shippingAddress.first_name)
      formData.append("shipping_address.last_name", shippingAddress.last_name)
      formData.append("shipping_address.address_1", shippingAddress.address_1)
      formData.append("shipping_address.address_2", shippingAddress.address_2)
      formData.append("shipping_address.company", "") // ⭐ String vacío, no null
      formData.append(
        "shipping_address.postal_code",
        shippingAddress.postal_code
      )
      formData.append("shipping_address.city", shippingAddress.city)
      formData.append(
        "shipping_address.country_code",
        shippingAddress.country_code
      )
      formData.append("shipping_address.province", shippingAddress.province)
      formData.append("shipping_address.phone", shippingAddress.phone)

      // Billing address - usando la estructura exacta que espera setAddresses
      formData.append("billing_address.first_name", billingAddress.first_name)
      formData.append("billing_address.last_name", billingAddress.last_name)
      formData.append("billing_address.address_1", billingAddress.address_1)
      formData.append("billing_address.address_2", billingAddress.address_2)
      formData.append("billing_address.company", "") // ⭐ String vacío, no null
      formData.append("billing_address.postal_code", billingAddress.postal_code)
      formData.append("billing_address.city", billingAddress.city)
      formData.append(
        "billing_address.country_code",
        billingAddress.country_code
      )
      formData.append("billing_address.province", billingAddress.province)
      formData.append("billing_address.phone", billingAddress.phone)

      console.log("🔄 Actualizando direcciones...")
      const addressResult = await setAddresses(null, formData)

      if (addressResult && typeof addressResult === "string") {
        throw new Error(addressResult)
      }

      console.log("✅ Direcciones actualizadas")

      // ⭐ CAMBIO PRINCIPAL: Actualizar método de envío ANTES de obtener el cart final
      const selectedShippingRate = event.shippingRate
      console.log("🚚 Método de envío seleccionado:", selectedShippingRate)

      if (selectedShippingRate && cart?.id) {
        console.log("💾 Guardando método de envío...")

        await setShippingMethod({
          cartId: cart.id,
          shippingMethodId: selectedShippingRate.id,
        })

        console.log("✅ Método de envío guardado")
      }

      // ⭐ CAMBIO PRINCIPAL: Obtener el cart actualizado DESPUÉS de todos los cambios
      console.log("🔄 Obteniendo cart final con todos los cambios...")

      // Usar el mismo import/sdk que usas en el resto del componente
      const finalCartResponse = await sdk.store.cart.retrieve(cart!.id, {
        fields: "*payment_collection.payment_sessions,*items,*shipping_methods",
      })

      const finalCart = finalCartResponse.cart // ⭐ AÑADIR .cart aquí

      console.log("📦 Cart final completo:", finalCart)
      console.log("📦 Cart final resumen:", {
        id: finalCart.id,
        total: finalCart.total,
        subtotal: finalCart.subtotal,
        shipping_total: finalCart.shipping_total,
        hasPaymentCollection: !!finalCart.payment_collection,
        paymentSessionsCount:
          finalCart.payment_collection?.payment_sessions?.length,
        hasShippingMethods: !!finalCart.shipping_methods?.length,
      })

      // ⭐ VERIFICACIÓN CRÍTICA: Comprobar si el cart se obtuvo correctamente
      if (
        !finalCart ||
        finalCart.total === undefined ||
        finalCart.total === null
      ) {
        console.error("❌ Error: No se pudo obtener el cart actualizado")
        console.log("🔍 Debug cart retrieval:", {
          cartId: cart!.id,
          finalCart,
          hasTotal: finalCart?.total !== undefined,
        })

        event.paymentFailed({ reason: "fail" })
        setExpressCheckoutError("Error obteniendo información del carrito")
        return
      }

      const cartTotalInCents = Math.round((finalCart.total || 0) * 100)
      const expectedTotalWithShipping = cartTotalInCents // El cart ya incluye el shipping

      console.log("💰 Verificación de montos:", {
        cartTotal: finalCart.total,
        cartTotalInCents,
        expectedTotal: expectedTotalWithShipping,
      })

      // ⭐ CAMBIO PRINCIPAL: Recrear payment collection solo si es necesario
      let paymentSession =
        finalCart?.payment_collection?.payment_sessions?.find(
          (session) =>
            session.provider_id === "pp_stripe_stripe" &&
            session.status === "pending"
        )

      console.log("🔍 Estado inicial de payment sessions:", {
        totalSessions:
          finalCart?.payment_collection?.payment_sessions?.length || 0,
        hasStripeSession: !!paymentSession,
        paymentCollectionAmount: finalCart?.payment_collection?.amount,
        cartTotal: finalCart.total,
      })

      // ⭐ Las payment sessions se borran automáticamente cuando cambia el total
      // SIEMPRE necesitamos recrear después de cambiar shipping
      if (
        !paymentSession?.data?.client_secret ||
        finalCart?.payment_collection?.payment_sessions?.length === 0
      ) {
        console.log(
          "🔄 Recreando payment collection (sessions invalidadas por cambio de total)..."
        )

        //@ts-ignore
        await createPaymentCollection(cart.id)

        // ⭐ IMPORTANTE: Inicializar sesiones de pago explícitamente
        console.log("🔄 Inicializando sesión de pago de Stripe...")
        if (!cart) {
          throw new Error("Cart is not available")
        }

        await initiatePaymentSession(cart, {
          provider_id: "pp_stripe_stripe",
        })

        // ⭐ IMPORTANTE: Esperar un poco más para que Medusa procese todo
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Obtener el cart OTRA VEZ después de recrear payment collection
        const refreshedCartResponse = await sdk.store.cart.retrieve(cart!.id, {
          fields:
            "*payment_collection.payment_sessions,*items,*shipping_methods",
        })

        const refreshedCart = refreshedCartResponse.cart // ⭐ AÑADIR .cart aquí

        console.log("🔄 Cart después de recrear payment collection:", {
          total: refreshedCart.total,
          paymentCollectionAmount: refreshedCart?.payment_collection?.amount,
          sessionsCount:
            refreshedCart?.payment_collection?.payment_sessions?.length,
        })

        paymentSession =
          refreshedCart?.payment_collection?.payment_sessions?.find(
            (session) =>
              session.provider_id === "pp_stripe_stripe" &&
              session.status === "pending"
          )

        if (paymentSession) {
          console.log("✅ Payment session recreada:", {
            id: paymentSession.id,
            status: paymentSession.status,
            hasClientSecret: !!paymentSession.data?.client_secret,
          })
        } else {
          console.log("❌ No se pudo crear payment session después de recrear")
          console.log(
            "🔍 Payment sessions disponibles:",
            refreshedCart?.payment_collection?.payment_sessions
          )
        }
      }

      if (!paymentSession?.data?.client_secret) {
        console.error("❌ No se encontró sesión de pago válida")
        event.paymentFailed({ reason: "fail" })
        setExpressCheckoutError("No se encontró sesión de pago válida")
        return
      }

      const clientSecret = paymentSession.data.client_secret as string
      console.log("🔑 Client secret obtenido con monto correcto")

      // ⭐ CAMBIO PRINCIPAL: Confirmar pago SIN payment_method_data
      console.log("💳 Confirmando pago...")

      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          // ❌ NO incluir payment_method_data para ExpressCheckout
          return_url: `${window.location.origin}/order/confirmed`,
        },
        redirect: "if_required",
      })

      if (paymentError) {
        console.error("❌ Error confirmando pago:", paymentError)
        event.paymentFailed({ reason: "fail" })
        setExpressCheckoutError(
          paymentError.message || "Error procesando el pago"
        )
        return
      }

      console.log("✅ Pago confirmado correctamente")

      // Completar la orden
      try {
        await placeOrder()
        console.log("✅ Orden completada exitosamente")
      } catch (orderError) {
        console.error("❌ Error completando la orden:", orderError)
        event.paymentFailed({ reason: "fail" })
        setExpressCheckoutError("Error completando la orden")
        return
      }
    } catch (error: any) {
      console.error("❌ Error en ExpressCheckout:", error)
      setExpressCheckoutError(
        error.message || "Error procesando el pago express"
      )
      event.paymentFailed({ reason: "fail" })
    } finally {
      setExpressCheckoutLoading(false)
    }
  }
  const onShippingAddressChange = async (event: any) => {
    console.log("📍 Cambio de dirección:", event.address)

    try {
      // Validar países permitidos
      const allowedCountries = [
        "ES",
        "FR",
        "IT",
        "DE",
        "PT",
        "NL",
        "BE",
        "GB",
        "US",
        "AU",
      ]

      if (!allowedCountries.includes(event.address?.country)) {
        console.log("❌ País no permitido:", event.address?.country)
        setExpressCheckoutError("No enviamos a este país")
        return event.reject({
          reason: "shipping_address_invalid",
        })
      }

      // Actualizar dirección temporal
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
        tempFormData.append("email", cart?.email || "temp@temp.com")
        Object.entries(tempAddress).forEach(([key, value]) => {
          tempFormData.append(`shipping_address.${key}`, value as string)
        })

        console.log("🔄 Actualizando dirección temporal...")
        await setAddresses(null, tempFormData)

        // Obtener opciones de envío reales
        if (cart?.id) {
          console.log("📦 Obteniendo shipping options para cart:", cart.id)
          realShippingOptions = (await listCartShippingMethods(cart.id)) || []
          console.log("🚚 Shipping options obtenidas:", realShippingOptions)
        }
      } catch (tempError) {
        console.log("⚠️ Error actualizando dirección temporal:", tempError)
      }

      // Mapear opciones de envío
      const shippingRates = await mapShippingRates(
        realShippingOptions,
        cart?.id
      )
      console.log("🚚 Opciones mapeadas para Stripe:", shippingRates)

      if (!shippingRates.length) {
        console.log("❌ No hay opciones de envío disponibles")
        setExpressCheckoutError(
          "No hay métodos de envío disponibles para esta dirección"
        )
        return event.reject({
          reason: "shipping_address_unserviceable",
        })
      }

      // Validar montos
      const validShippingRates = shippingRates.map((rate) => {
        if (rate.amount <= 0) {
          return { ...rate, amount: 0 }
        }
        return rate
      })

      console.log("🚚 Opciones finales para Google Pay:", validShippingRates)

      // Actualizar total con envío
      if (elements && cart?.total && validShippingRates.length > 0) {
        const cartTotalInCents = Math.round(cart.total * 100)
        const firstShippingRate = validShippingRates[0].amount
        const totalWithShipping = cartTotalInCents + firstShippingRate

        console.log("💰 Actualizando total:", totalWithShipping, "centavos")

        try {
          elements.update({ amount: totalWithShipping })
          console.log("✅ Elements actualizado correctamente")
        } catch (updateError: any) {
          console.log("⚠️ No se pudo actualizar Elements:", updateError.message)
        }
      }

      // Resolver con opciones válidas
      const resolveDetails = { shippingRates: validShippingRates }
      console.log("✅ Resolviendo cambio de dirección")
      return event.resolve(resolveDetails)
    } catch (error) {
      console.error("❌ Error en onShippingAddressChange:", error)
      return event.reject({ reason: "shipping_address_invalid" })
    }
  }

  const onShippingRateChange = async (event: any) => {
    console.log("🚚 Cambio de tarifa de envío:", event.shippingRate)

    try {
      if (elements && cart?.total) {
        const shippingAmount = event.shippingRate.amount
        const cartTotalInCents = Math.round(cart.total * 100)
        const newTotal = cartTotalInCents + shippingAmount

        console.log("💰 Nuevo total:", newTotal, "centavos")

        try {
          elements.update({ amount: newTotal })
          console.log("✅ Elements actualizado en onShippingRateChange")
        } catch (updateError: any) {
          console.log("⚠️ Error actualizando Elements:", updateError.message)
        }
      }

      console.log("✅ Resolviendo cambio de tarifa")
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
        const timer = setTimeout(() => setShowButton(true), 5000)
        return () => clearTimeout(timer)
      }
    }

    form.addEventListener("blur", onBlur, true)
    return () => form.removeEventListener("blur", onBlur, true)
  }, [formRef])

  const [message, formAction] = useFormState(setAddresses, null)

  const handleSubmit = async (formData: FormData) => {
    console.log("📝 Enviando formulario manual...")

    // Debug: mostrar datos que se están enviando
    console.log("📋 Datos del formulario:")
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`)
    })

    // ⭐ CAPTURAR el estado de hasAutoSubmitted ANTES de resetearlo
    const wasAutoSubmitted = hasAutoSubmitted

    setSubmitCount((prev) => prev + 1)
    setHasAutoSubmitted(false) // Reset para permitir futuros auto-submits

    const result = await formAction(formData)
    
    console.log("🔍 Debug después del formAction:", {
      result,
      wasAutoSubmitted,
      resultType: typeof result
    })
    
    // Si el formulario se completó exitosamente y fue auto-submitted, navegar al siguiente step
    //@ts-ignore
    if (!result && wasAutoSubmitted) {
      console.log("✅ Auto-submit exitoso, verificando actualización...")
      
      // Verificar que el carrito tenga los datos actualizados antes de navegar
      const checkCartUpdated = () => {
        console.log("🔍 Verificando estado del cart:", {
          hasShippingAddress: !!cart?.shipping_address,
          firstName: cart?.shipping_address?.first_name,
          email: cart?.email
        })
        
        // Verificar que tanto shipping_address como email estén actualizados
        if (cart?.shipping_address?.first_name && cart?.email) {
          console.log("🔄 Cart actualizado correctamente, navegando a delivery...")
          navigateToNextStep()
        } else {
          console.log("⏳ Cart aún no actualizado, esperando...")
          setTimeout(checkCartUpdated, 500)
        }
      }
      
      // Empezar a verificar después de un pequeño delay inicial
      setTimeout(checkCartUpdated, 500)
    }

    return result
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

  // Condiciones para mostrar ExpressCheckout - simplificadas
  const shouldShowExpressCheckout =
    stripeReady &&
    stripe !== null &&
    elements !== null &&
    cart &&
    cart.total &&
    cart.total > 0 &&
    cart.payment_collection

  // Debug log para ver por qué desaparece
  useEffect(() => {
    console.log("🔍 Debug shouldShowExpressCheckout:", {
      stripeReady,
      stripe: !!stripe,
      elements: !!elements,
      cart: !!cart,
      cartTotal: cart?.total,
      paymentCollection: !!cart?.payment_collection,
      shouldShow: shouldShowExpressCheckout,
    })
  }, [stripeReady, stripe, elements, cart, shouldShowExpressCheckout])

  return (
    <div className="bg-white">
      {/* Express Checkout - solo mostrar cuando el step está activo */}
      {shouldShowExpressCheckout && (
        <div className="mb-6">
          <Heading
            level="h2"
            className="font-archivo text-center py-4 text-sm text-gray-500"
          >
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
            {!stripeReady && <ExpressCheckoutSkeleton />}

            {shouldShowExpressCheckout && (
              <ExpressCheckoutElement
                key={`express-checkout-${cart?.id}`}
                options={{
                  paymentMethodOrder: ["apple_pay", "google_pay", "link"],
                  paymentMethods: {
                    applePay: "always",
                    googlePay: "always",
                    link: "auto",
                    paypal: "never",
                    klarna: "never",
                  },
                  buttonHeight: 48,
                  layout: {
                    maxColumns: 2, // Muestra máximo 2 opciones antes del acordeón
                    overflow: "auto", // Permite el acordeón para opciones adicionales
                  },
                }}
                onCancel={onCancel}
                onReady={onReady}
                onShippingAddressChange={onShippingAddressChange}
                onClick={onClick}
                onConfirm={onConfirm}
                onShippingRateChange={onShippingRateChange}
              />
            )}
          </div>

          {expressCheckoutLoading && (
            <div className="mt-3 flex items-center gap-2">
              <Spinner />
              <Text className="text-sm">Procesando pago express...</Text>
            </div>
          )}

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">O</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
        </div>
      )}

      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-2xl pt-6 font-semibold font-archivoBlack uppercase gap-x-2 items-baseline"
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
        // Formulario activo
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
                  DIRECCIÓN DE ENVÍO
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            {/* Botón manual como fallback */}
            {(showButton || (!isFormComplete && submitCount > 0)) && (
              <SubmitButton className="mt-6" data-testid="submit-address-button">
                Actualizar datos
              </SubmitButton>
            )}
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        // Vista de resumen cuando el step está completado
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