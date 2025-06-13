import { clx } from "@medusajs/ui"

import { getPercentageDiff } from "@lib/util/get-precentage-diff"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
}

const LineItemPrice = ({ item, style = "default" }: LineItemPriceProps) => {
  // Verificar si el item tiene variante
  const hasVariant = item.variant && Object.keys(item.variant).length > 0
  
  // Calcular adjustments (descuentos aplicados al item)
  const adjustmentsSum = (item.adjustments || []).reduce(
    (acc, adjustment) => adjustment.amount + acc,
    0
  )

  // Si tiene variante, usar el método existente
  if (hasVariant) {
    const { currency_code, calculated_price_number, original_price_number } =
      getPricesForVariant(item.variant) ?? {}

    const originalPrice = original_price_number * item.quantity
    const currentPrice = calculated_price_number * item.quantity - adjustmentsSum
    const hasReducedPrice = currentPrice < originalPrice

    return (
      <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
        <div className="text-left">
          {hasReducedPrice && (
            <>
              <p>
                {style === "default" && (
                  <span className="text-ui-fg-subtle">Original: </span>
                )}
                <span
                  className="line-through text-ui-fg-muted"
                  data-testid="product-original-price"
                >
                  {convertToLocale({
                    amount: originalPrice,
                    currency_code,
                  })}
                </span>
              </p>
              {style === "default" && (
                <span className="text-ui-fg-interactive">
                  -{getPercentageDiff(originalPrice, currentPrice || 0)}%
                </span>
              )}
            </>
          )}
          <span
            className={clx("text-base-regular", {
              "text-ui-fg-interactive": hasReducedPrice,
            })}
            data-testid="product-price"
          >
            {convertToLocale({
              amount: currentPrice,
              currency_code,
            })}
          </span>
        </div>
      </div>
    )
  }

  // Si no tiene variante (como nuestro item COD), usar unit_price directamente
  // Asumir EUR como moneda por defecto para items custom
  const currency_code = "eur" // Puedes ajustar esto según tu configuración
  const originalPrice = item.unit_price * item.quantity
  const currentPrice = originalPrice - adjustmentsSum
  
  // Los items custom normalmente no tienen descuentos de precio base
  const hasReducedPrice = adjustmentsSum > 0

  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-left">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-ui-fg-subtle">Original: </span>
              )}
              <span
                className="line-through text-ui-fg-muted"
                data-testid="product-original-price"
              >
                {convertToLocale({
                  amount: originalPrice,
                  currency_code,
                })}
              </span>
            </p>
            {style === "default" && (
              <span className="text-ui-fg-interactive">
                -{getPercentageDiff(originalPrice, currentPrice || 0)}%
              </span>
            )}
          </>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive": hasReducedPrice,
          })}
          data-testid="product-price"
        >
          {convertToLocale({
            amount: currentPrice,
            currency_code,
          })}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice