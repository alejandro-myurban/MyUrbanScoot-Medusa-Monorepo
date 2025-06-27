import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex gap-4 items-center text-ui-fg-base font-archivoBlack">
      <span
        className={clx("text-xl-semi ", {
          "text-gray-900 text-2xl font-semibold": selectedPrice.price_type === "sale",
        })}
      >
        {!variant && "From "}
        <span
          className="flex flex-col "
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price} <span className="text-sm">IVA incluido*</span>
        </span>
      </span>
      {selectedPrice.price_type === "sale" && (
        <>
          <p>
            <span
              className="line-through font-archiveBlack text-ui-fg-muted text-2xl"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <div>
            <span className="bg-mysRed-100 text-white text-xs font-semibold px-2 py-1 rounded">
              -{selectedPrice.percentage_diff}%
            </span>
          </div>
        </>
      )}
    </div>
  )
}
