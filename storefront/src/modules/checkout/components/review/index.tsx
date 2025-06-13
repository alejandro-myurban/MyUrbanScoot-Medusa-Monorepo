"use client"

import { Heading, Text, clx } from "@medusajs/ui"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // Debug: Agregar logs detallados
  console.log("=== CART DEBUG ===")
  console.log("Cart:", cart)
  console.log("Shipping address:", cart?.shipping_address)
  console.log("Shipping methods:", cart?.shipping_methods)
  console.log("Payment collection:", cart?.payment_collection)
  console.log("Payment sessions:", cart?.payment_collection?.payment_sessions)
  console.log("Gift cards:", cart?.gift_cards)
  console.log("Paid by giftcard:", paidByGiftcard)
  console.log("==================")

  // Verificación mejorada para payment collection
  const hasValidPayment = () => {
    // Si está pagado por gift card, no necesita payment collection
    if (paidByGiftcard) return true
    
    // Verificar si existe payment_collection
    if (!cart?.payment_collection) {
      console.log("❌ No payment_collection found")
      return false
    }
    
    // Verificar si hay payment sessions
    const paymentSessions = cart.payment_collection.payment_sessions
    if (!paymentSessions || paymentSessions.length === 0) {
      console.log("❌ No payment sessions found")
      return false
    }
    
    // Verificar si hay al menos una sesión activa (pending o authorized)
    const activeSession = paymentSessions.find(
      (session: any) => session.status === "pending" || session.status === "authorized"
    )
    
    if (!activeSession) {
      console.log("❌ No active payment session found")
      console.log("Available sessions:", paymentSessions.map((s: any) => ({ id: s.id, status: s.status, provider: s.provider_id })))
      return false
    }
    
    console.log("✅ Valid payment found:", activeSession)
    return true
  }

  // Condición mejorada para previous steps
  const previousStepsCompleted = 
    cart?.shipping_address &&
    cart?.shipping_methods?.length > 0 &&
    hasValidPayment()

  console.log("PREVIOUS STEP COMPLETED:", previousStepsCompleted)

  // Mostrar información de debug en desarrollo
  const showDebugInfo = process.env.NODE_ENV === 'development'

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          {t("checkout.review")}
        </Heading>
      </div>

      {/* Debug info en desarrollo */}
      {showDebugInfo && isOpen && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-xs">
          <strong>Debug Info:</strong>
          <div>Shipping Address: {cart?.shipping_address ? "✅" : "❌"}</div>
          <div>Shipping Methods: {cart?.shipping_methods?.length > 0 ? "✅" : "❌"} ({cart?.shipping_methods?.length})</div>
          <div>Payment Collection: {cart?.payment_collection ? "✅" : "❌"}</div>
          <div>Payment Sessions: {cart?.payment_collection?.payment_sessions?.length || 0}</div>
          <div>Valid Payment: {hasValidPayment() ? "✅" : "❌"}</div>
          <div>Previous Steps: {previousStepsCompleted ? "✅" : "❌"}</div>
        </div>
      )}

      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                By clicking the Place Order button, you confirm that you have
                read, understand and accept our Terms of Use, Terms of Sale and
                Returns Policy and acknowledge that you have read Medusa
                Store&apos;s Privacy Policy.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}

      {/* Mensaje de error si faltan pasos */}
      {isOpen && !previousStepsCompleted && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Text className="txt-small text-red-800">
            ⚠️ Completa todos los pasos anteriores antes de continuar:
          </Text>
          <ul className="mt-2 text-xs text-red-700">
            {!cart?.shipping_address && <li>• Dirección de envío</li>}
            {!cart?.shipping_methods?.length && <li>• Método de envío</li>}
            {!hasValidPayment() && <li>• Método de pago</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Review