"use client"

import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { placeOrder } from "@lib/data/cart"
import ErrorMessage from "../error-message"

interface PayPalPaymentButtonProps {
  cart: HttpTypes.StoreCart
  notReady?: boolean
  "data-testid"?: string
}

const PayPalPaymentButton = ({
  cart,
  notReady = false,
  "data-testid": dataTestId,
}: PayPalPaymentButtonProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Obtener el estado del script de PayPal
  const [{ isPending, isResolved, isRejected }, dispatch] =
    usePayPalScriptReducer()

  // Debug: Verificar el estado de PayPal
  console.log("🔍 PayPal Script State:", {
    isPending,
    isResolved,
    isRejected,
    windowPayPal: typeof window !== "undefined" ? !!window.paypal : "N/A",
    windowPayPalButtons:
      typeof window !== "undefined" ? !!window.paypal?.Buttons : "N/A",
  })

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        console.error("❌ Error en placeOrder:", err)
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  // 🔍 DEBUG MEJORADO - Encontrar la sesión de pago
  const allSessions = cart.payment_collection?.payment_sessions || []
  const paypalSession = allSessions.find(
    (s) =>
      s.provider_id === "pp_paypal-payment_paypal-payment"
  )
  const pendingSession = allSessions.find((s) => s.status === "pending")

  console.log("🔍 PayPal Session Debug:", {
    allSessions: allSessions.map((s) => ({
      provider_id: s.provider_id,
      status: s.status,
      hasData: !!s.data,
      dataKeys: s.data ? Object.keys(s.data) : [],
    })),
    paypalSession,
    pendingSession,
    expectedProviderId: "pp_paypal-payment_paypal-payment",
  })

  // Usar la sesión de PayPal independientemente del estado
  const session = paypalSession

  console.log("🔍 PayPal Session:", session)

  const handlePayment = async (
    _data: OnApproveData,
    actions: OnApproveActions
  ) => {
    setSubmitting(true)

    try {
      if (!actions.order) {
        throw new Error("Actions.order no está disponible")
      }

      const authorization = await actions.order.authorize()
      console.log("✅ PayPal Authorization Result:", authorization)

      if (authorization.status !== "COMPLETED") {
        throw new Error(`Estado de autorización: ${authorization.status}`)
      }

      await onPaymentCompleted()
    } catch (error: any) {
      console.error("❌ PayPal authorization error:", error)
      setErrorMessage(error.message || "Error al procesar el pago con PayPal")
      setSubmitting(false)
    }
  }

  // 🔍 VERIFICACIÓN MEJORADA - Mostrar información detallada si no hay sesión
  if (!session) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-700 text-sm font-medium">
          ❌ No se encontró sesión de pago de PayPal
        </p>
        <p className="text-red-600 text-xs mt-1">
          Provider ID esperado: "pp_paypal-payment_paypal-payment"
        </p>

        <div className="mt-3">
          <p className="text-red-600 text-xs font-medium">
            Sesiones disponibles:
          </p>
          <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(
              allSessions.map((s) => ({
                provider_id: s.provider_id,
                status: s.status,
                hasData: !!s.data,
                dataKeys: s.data ? Object.keys(s.data) : [],
              })),
              null,
              2
            )}
          </pre>
        </div>

        <div className="mt-3">
          <p className="text-red-600 text-xs font-medium">Diagnóstico:</p>
          <ul className="text-red-600 text-xs mt-1 list-disc list-inside">
            <li>Total de sesiones: {allSessions.length}</li>
            <li>
              Sesiones pendientes:{" "}
              {allSessions.filter((s) => s.status === "pending").length}
            </li>
            <li>
              ¿Hay PayPal collection? {!!cart.payment_collection ? "Sí" : "No"}
            </li>
          </ul>
        </div>

        <div className="mt-3">
          <p className="text-red-600 text-xs font-medium">
            Posibles soluciones:
          </p>
          <ul className="text-red-600 text-xs mt-1 list-disc list-inside">
            <li>Verifica que PayPal esté habilitado en Medusa Admin</li>
            <li>Revisa las credenciales de PayPal en el backend</li>
            <li>Intenta seleccionar otro método y volver a PayPal</li>
          </ul>
        </div>
      </div>
    )
  }

  // Verificar que tenemos el paypalOrderId
  if (!session.data?.paypalOrderId) {
    return (
      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <p className="text-yellow-700 text-sm font-medium">
          ⚠️ Sesión de PayPal encontrada pero sin paypalOrderId
        </p>
        <p className="text-yellow-600 text-xs mt-1">
          Estado de la sesión: {session.status}
        </p>

        <div className="mt-3">
          <p className="text-yellow-600 text-xs font-medium">
            Datos de la sesión:
          </p>
          <pre className="mt-1 text-xs text-yellow-600 bg-yellow-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(session.data, null, 2)}
          </pre>
        </div>

        <div className="mt-3">
          <p className="text-yellow-600 text-xs font-medium">
            Posibles causas:
          </p>
          <ul className="text-yellow-600 text-xs mt-1 list-disc list-inside">
            <li>La sesión se creó pero falló la inicialización con PayPal</li>
            <li>Problema con las credenciales de PayPal</li>
            <li>Error de red con los servidores de PayPal</li>
          </ul>
        </div>
      </div>
    )
  }

  // Estados de carga del script
  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cargando PayPal...</p>
        </div>
      </div>
    )
  }

  // Error en la carga del script
  if (isRejected) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-700 text-sm font-medium">
          ❌ Error al cargar PayPal
        </p>
        <p className="text-red-600 text-xs mt-1">
          Verifica tu NEXT_PUBLIC_PAYPAL_CLIENT_ID y tu conexión a internet
        </p>
        <p className="text-red-600 text-xs mt-1">
          Client ID actual:{" "}
          {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "No configurado"}
        </p>
        <button
          onClick={() => {
            console.log("🔄 Reintentando cargar PayPal...")
            dispatch({
              type: "resetOptions",
              value: {
                "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                currency: cart?.currency_code?.toUpperCase() || "EUR",
                intent: "authorize",
                components: "buttons",
              },
            })
          }}
          className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Script cargado correctamente
  if (isResolved) {
    // Verificación adicional de que window.paypal.Buttons existe
    if (typeof window !== "undefined" && !window.paypal?.Buttons) {
      return (
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <p className="text-yellow-700 text-sm">
            ⚠️ PayPal script cargado pero Buttons no disponible. Recargando...
          </p>
        </div>
      )
    }

    return (
      <>
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <p className="text-green-700">✅ PayPal configurado correctamente</p>
          <p className="text-green-600">
            Order ID: {session.data?.paypalOrderId as string}
          </p>
          <p className="text-green-600">Estado: {session.status}</p>
        </div>

        <PayPalButtons
          style={{
            layout: "horizontal",
            color: "blue",
            shape: "rect",
            label: "pay",
            height: 45,
          }}
          createOrder={async () => {
            const orderId = session.data.paypalOrderId as string
            console.log("🎯 Creating PayPal order with ID:", orderId)
            return orderId
          }}
          onApprove={handlePayment}
          onError={(error) => {
            console.error("❌ PayPal button error:", error)
            setErrorMessage("Error al procesar el pago con PayPal")
            setSubmitting(false)
          }}
          onCancel={() => {
            console.log("⚠️ PayPal payment cancelled by user")
            setSubmitting(false)
          }}
          disabled={notReady || submitting}
          data-testid={dataTestId}
        />

        {errorMessage && (
          <ErrorMessage
            error={errorMessage}
            data-testid="paypal-payment-error-message"
          />
        )}

        {submitting && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">Procesando pago...</p>
          </div>
        )}
      </>
    )
  }

  // Estado por defecto
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <p className="text-gray-700 text-sm">Inicializando PayPal...</p>
    </div>
  )
}

export default PayPalPaymentButton
