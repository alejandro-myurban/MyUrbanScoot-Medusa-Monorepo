"use client"

import { useState, useEffect } from "react"
import { Heading } from "@medusajs/ui"
import LoyaltyPoints from "../../components/loyalty-points"
import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { ChevronDown } from "lucide-react"
import { TermsCheckbox } from "@modules/checkout/components/terms-checkbox"
import { FreeShippingProgress } from "@modules/checkout/components/free-shipping-progress"

// Hook para detectar si estamos en desktop
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1023) // md breakpoint en Tailwind
    }

    // Verificar al montar
    checkIsDesktop()

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsDesktop)
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  return isDesktop
}

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const isDesktop = useIsDesktop()

  console.log("CARRO", cart)

  // En desktop siempre expandido, en mobile controlado por estado
  const isExpanded = isDesktop || isMobileExpanded

  const toggleAccordion = () => {
    // Solo permitir toggle en mobile
    if (!isDesktop) {
      setIsMobileExpanded(!isMobileExpanded)
    }
  }

  // Calcular total del carrito
  const formatPrice = (amount: number, currencyCode: string = "EUR") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currencyCode,
    }).format(amount)
  }

  return (
    <div className="sticky top-0 z-10 order-first lg:order-none">
      {/* Header del acordeón */}
      <div
        className={`bg-gray-200 border border-gray-300 px-4 py-4 font-archivo transition-all duration-200 ${
          isExpanded 
            ? "rounded-t-lg border-b border-gray-300" 
            : "rounded-lg"
        } ${
          // Solo hacer clickeable en mobile
          !isDesktop ? "cursor-pointer select-none" : "select-none"
        }`}
        onClick={toggleAccordion}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heading
              level="h2"
              className="text-base text-gray-900 font-archivo"
            >
              Resumen del pedido
            </Heading>
            {/* Solo mostrar chevron en mobile */}
            {!isDesktop && (
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                  isMobileExpanded ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
          <div className="text-base font-archivoBlack text-black/90">
            {formatPrice(cart?.total || 0, cart?.currency_code)}
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
      <div
        className={`bg-gray-200 border-l border-r border-b border-gray-300 rounded-b-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 space-y-2 overflow-y-auto max-h-[70vh]">
          {/* Items del carrito */}
          <div>
            <ItemsPreviewTemplate items={cart?.items} />
          </div>

          {/* Código de descuento */}
          <div>
            <DiscountCode cart={cart} />
          </div>

          <Divider />
          
          {/* Totales del carrito */}
          <div>
            <CartTotals totals={cart} />
          </div>

          <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} />

          <FreeShippingProgress
            currentAmount={cart.item_subtotal}
            freeShippingThreshold={100.0}
          />

          {/* Puntos de lealtad si existe cliente */}
          {cart.customer_id && (
            <div>
              <LoyaltyPoints cart={cart} />
            </div>
          )}

          {/* Solo mostrar botón cerrar en mobile */}
          {!isDesktop && (
            <div 
              onClick={toggleAccordion}
              className="cursor-pointer hover:bg-gray-100 rounded p-2 transition-colors"
            >
              <p className="text-center font-archivoBlack uppercase text-sm">
                Cerrar resumen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary