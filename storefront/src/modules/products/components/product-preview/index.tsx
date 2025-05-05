import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

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

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="flex txt-compact-medium mt-4 justify-between">
          <Text className="text-ui-fg-subtle" data-testid="product-title">
            {product.title}
          </Text>
          <div className="flex items-center gap-x-2">
            {discountedPrice ? (
              <PreviewPrice price={discountedPrice} />
            ) : (
              cheapestPrice && <PreviewPrice price={cheapestPrice} />
            )}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
