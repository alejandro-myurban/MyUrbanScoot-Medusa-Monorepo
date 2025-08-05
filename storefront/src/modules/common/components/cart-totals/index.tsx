"use client"
import { convertToLocale } from "@lib/util/money"
import { InformationCircleSolid } from "@medusajs/icons"
import { Tooltip } from "@medusajs/ui"
import React from "react"
import { useTranslation } from "react-i18next"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    shipping_total?: number | null
    discount_total?: number | null
    gift_card_total?: number | null
    currency_code: string
    item_subtotal: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    subtotal,
    tax_total, 
    shipping_total,
    discount_total,
    gift_card_total,
    item_subtotal
  } = totals
   
  const { t } = useTranslation()
  
  // Precio original (con IVA incluido)
  const originalSubtotal = total && shipping_total ? total - shipping_total : total
  
  // Mostrar descuento de IVA solo si hay tax_total
  const showVATDiscount = tax_total && tax_total > 0

  console.log("TOTALES", totals)
  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium sm:text-xl text-black/90 font-archivo ">
        <div className="flex items-center justify-between">
          <span className="flex gap-x-1 items-center">
            {t("checkout.summary.subtotal")}
          </span>
          <span data-testid="cart-subtotal" data-value={subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        
        {!!discount_total && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_total || 0}
            >
              -{" "}
              {convertToLocale({ amount: discount_total ?? 0, currency_code })}
            </span>
          </div>
        )}

        {/* Descuento de IVA para envíos internacionales */}
        {showVATDiscount && (
          <div className="flex items-center justify-between">
            <span className="flex gap-x-1 items-center">
              IVA no aplicable (envío internacional)
              <span content="El IVA no se aplica en envíos a países fuera de la UE">
                <InformationCircleSolid className="w-4 h-4 text-ui-fg-muted" />
              </span>
            </span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-vat-discount"
              data-value={tax_total || 0}
            >
              -{" "}
              {convertToLocale({ amount: tax_total ?? 0, currency_code })}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span>{t("checkout.summary.shipping")}</span>
          <span data-testid="cart-shipping" data-value={shipping_total || 0}>
            {convertToLocale({ amount: shipping_total ?? 0, currency_code })}
          </span>
        </div>
        
        {/* {typeof tax_total === 'number' && tax_total > 0 && (
          <div className="flex justify-between">
            <span className="flex gap-x-1 items-center ">
              {t("checkout.summary.taxes") || "IVA"} 
              <Tooltip content="El IVA se calcula al finalizar la compra.">
                <InformationCircleSolid className="w-4 h-4 text-ui-fg-muted" />
              </Tooltip>
            </span>
            <span data-testid="cart-taxes" data-value={tax_total || 0}>
              {convertToLocale({ amount: tax_total ?? 0, currency_code })}
            </span>
          </div>
        )} */}

        {!!gift_card_total && (
          <div className="flex items-center justify-between">
            <span>Gift card</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-gift-card-amount"
              data-value={gift_card_total || 0}
            >
              -{" "}
              {convertToLocale({ amount: gift_card_total ?? 0, currency_code })}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center mt-2 justify-between text-black/90 font-bold text-xl sm:text-2xl mb-2 txt-medium font-dmSans ">
        <span>{t("checkout.summary.total")}</span>
        <span
          className="text-xl sm:text-2xl font-archivo font-bold"
          data-testid="cart-total"
          data-value={showVATDiscount ? subtotal : total || 0}
        >
          {convertToLocale({ 
            amount: showVATDiscount ? (subtotal ?? 0) : (total ?? 0), 
            currency_code 
          })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals