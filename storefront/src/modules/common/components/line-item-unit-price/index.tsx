import { getPricesForVariant } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
}

const LineItemUnitPrice = ({
  item,
  style = "default",
}: LineItemUnitPriceProps) => {
  // Verificar si el item tiene variante
  const hasVariant = item.variant && Object.keys(item.variant).length > 0
  
  // Si tiene variante, usar el método existente
  if (hasVariant) {
    const {
      original_price,
      calculated_price,
      original_price_number,
      calculated_price_number,
      percentage_diff,
    } = getPricesForVariant(item.variant) ?? {}
    
    const hasReducedPrice = calculated_price_number < original_price_number

    return (
      <div className="flex flex-col text-ui-fg-muted justify-center h-full">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-ui-fg-muted">Original: </span>
              )}
              <span
                className="line-through"
                data-testid="product-unit-original-price"
              >
                {original_price}
              </span>
            </p>
            {style === "default" && (
              <span className="text-ui-fg-interactive">-{percentage_diff}%</span>
            )}
          </>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive": hasReducedPrice,
          })}
          data-testid="product-unit-price"
        >
          {calculated_price}
        </span>
      </div>
    )
  }

  // Si no tiene variante (como nuestro item COD), usar unit_price directamente
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price) 
  }

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      <span
        className="text-base-regular"
        data-testid="product-unit-price"
      >
        {formatPrice(item.unit_price)}
      </span>
    </div>
  )
}

export default LineItemUnitPrice