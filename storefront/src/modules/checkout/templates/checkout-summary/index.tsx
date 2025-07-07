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
import { useTranslation } from "react-i18next"

// Hook para detectar si estamos en desktop
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024) // lg breakpoint en Tailwind (1024px)
    }

    // Verificar al montar
    checkIsDesktop()

    // Escuchar cambios de tamaño
    window.addEventListener("resize", checkIsDesktop)
    return () => window.removeEventListener("resize", checkIsDesktop)
  }, [])

  return isDesktop
}

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const isDesktop = useIsDesktop()
  const { t } = useTranslation()
  
  // En desktop siempre expandido, en mobile controlado por estado
  const isExpanded = isDesktop || isMobileExpanded

  const toggleAccordion = () => {
    // Solo permitir toggle en mobile
    if (!isDesktop) {
      setIsMobileExpanded(!isMobileExpanded)
    }
  }

  const formatPrice = (amount: number, currencyCode: string = "EUR") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currencyCode,
    }).format(amount)
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="bg-gray-200 lg:pl-10 rounded-lg overflow-hidden">
          {/* Header del resumen */}
          <div
            className={`
              bg-gray-200 
              border border-gray-300 
              lg:border-none
              lg:pt-6
              px-4 py-3
              font-archivo 
              transition-all duration-200 
              ${isExpanded
                ? "rounded-t-lg border-b border-gray-300"
                : "rounded-lg"
              } 
              ${!isDesktop ? "cursor-pointer select-none" : "select-none"}
            `}
            onClick={toggleAccordion}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heading
                  level="h2"
                  className="text-sm lg:text-2xl text-gray-900 font-archivoBlack uppercase"
                >
                  {t("checkout.summary.title")}
                </Heading>
                {/* Solo mostrar chevron en mobile */}
                {!isDesktop && (
                  <ChevronDown
                    className={`w-4 h-4 small:w-5 small:h-5 text-gray-500 transition-transform duration-200 ${
                      isMobileExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>
              <div className="text-sm lg:text-gray-200 font-archivoBlack text-black/90">
                {formatPrice(cart?.total || 0, cart?.currency_code)}
              </div>
            </div>
          </div>

          {/* Contenido expandible */}
          <div
            className={`
              bg-gray-200 
              border-l border-r border-b border-gray-300 
              rounded-b-lg 
              small:border-none 
              overflow-hidden 
              transition-all duration-300 ease-in-out 
              ${isExpanded ? "max-h-[70vh] small:max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <div className={`
              p-3 small:p-4 space-y-2 
              overflow-y-auto 
              ${isDesktop 
                ? 'max-h-[calc(100vh-8rem)]' 
                : 'max-h-[calc(95vh-4rem)]'
              }
            `}>
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

              <TermsCheckbox
                checked={termsAccepted}
                onChange={setTermsAccepted}
              />

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
                  <p className="text-center font-archivoBlack uppercase text-xs small:text-sm">
                    Cerrar resumen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary