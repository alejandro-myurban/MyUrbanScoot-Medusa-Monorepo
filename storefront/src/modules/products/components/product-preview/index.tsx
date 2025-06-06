import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { ProductAverageReview } from "@modules/product-reviews/components/ProductAverageReview"



export default async function ProductPreview({
  product,
  isFeatured,
  region,
  discount,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  discount?: string | number
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    //@ts-ignore
    product: pricedProduct,
  })

  // Process discount if available
  let discountedPrice = null
  if (cheapestPrice && discount) {
    // Convert discount to number if it's a string
    const discountAmount =
      typeof discount === "string" ? parseFloat(discount) : discount

    // Only apply discount if it's a valid number
    if (!isNaN(discountAmount) && discountAmount > 0) {
      // Get the original price number
      const originalPriceNumber =
        cheapestPrice.calculated_price_number ||
        parseFloat(
          (cheapestPrice.calculated_price || "")
            .toString()
            .replace(/[^0-9.,]+/g, "")
            .replace(",", ".")
        )

      // Calculate the discounted price
      const discountedPriceNumber =
        originalPriceNumber * (1 - discountAmount / 100)

      // Format the discounted price to match the original format
      let formattedDiscountedPrice

      // Determine currency format based on original price
      if (
        typeof cheapestPrice.calculated_price === "string" &&
        cheapestPrice.calculated_price.includes("€")
      ) {
        formattedDiscountedPrice = `€${discountedPriceNumber.toFixed(2)}`
      } else if (
        typeof cheapestPrice.calculated_price === "string" &&
        cheapestPrice.calculated_price.includes("$")
      ) {
        formattedDiscountedPrice = `$${discountedPriceNumber.toFixed(2)}`
      } else {
        formattedDiscountedPrice = discountedPriceNumber.toFixed(2)
      }

      // Create a copy of the cheapest price with the discount applied
      discountedPrice = {
        ...cheapestPrice,
        calculated_price_number: discountedPriceNumber,
        calculated_price: formattedDiscountedPrice,
        original_price: cheapestPrice.calculated_price,
        price_type: "sale", // Set price_type to "sale" to indicate a discounted price
      }
    }
  }

  // Si tanto original_price_number como calculated_price_number existen, calculamos el % de descuento
  let discountPercent: number | null = null
  if (
    typeof cheapestPrice?.original_price_number === "number" &&
    typeof cheapestPrice.calculated_price_number === "number" &&
    cheapestPrice.original_price_number > cheapestPrice.calculated_price_number
  ) {
    const orig = cheapestPrice.original_price_number
    const calc = cheapestPrice.calculated_price_number
    // Porcentaje de descuento redondeado
    discountPercent = Math.round((1 - calc / orig) * 100)
  }

  return (
    <LocalizedClientLink href={`/producto/${product.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className={`font-dmSans bg-white overflow-hidden rounded-b-lg rounded-t-lg border-gray-300 border-[0.5px] shadow-sm hover:shadow-md transition-shadow duration-200`}
      >
        {/* Imagen del producto */}
        <div className="relative overflow-hidden">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="!p-0 !bg-gray-50 !rounded-none" 
          />

          {/* Contenido de la tarjeta */}
          <div className="p-4 space-y-3 ">
            {/* Título del producto */}
            <Text
              className="text-gray-900 font-dmSans font-medium text-base leading-tight"
              data-testid="product-title"
            >
              {product.title}
            </Text>

            {/* Rating de estrellas */}
            <div className="flex items-center">
              <ProductAverageReview productId={product.id} />
            </div>

            {/* Precios */}
            <div className="flex items-end gap-x-3 flex-wrap">
              {discountedPrice ? (
                <>
                  {/* Precio con descuento */}
                  <div className="text-xl font-dmSans font-bold text-gray-900">
                    <PreviewPrice price={discountedPrice} />
                  </div>
                  {/* Precio original tachado */}
                  {cheapestPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      <PreviewPrice price={cheapestPrice} />
                    </div>
                  )}
                </>
              ) : (
                cheapestPrice && (
                  <div className="text-2xl flex gap-2 font-bold text-gray-900">
                    <PreviewPrice price={cheapestPrice} />
                  </div>
                )
              )}
              {/* Badge de descuento (si aplica) */}
              {discountPercent !== null && (
                <div className="font-dmSans bg-mysRed-100 text-white text-base font-semibold px-2 py-1 rounded-3xl">
                  -{discountPercent}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
