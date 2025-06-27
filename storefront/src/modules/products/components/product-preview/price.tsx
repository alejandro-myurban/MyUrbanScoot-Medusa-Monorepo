import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <>
      <Text
        className={clx("text-gray-900 font-dmSans text-base  sm:text-2xl font-bold", {
          "text-gray-900 text-base  sm:text-2xl font-dmSans ": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
      {price.price_type === "sale" && (
        <Text
          className="line-through font-dmSans text-base  sm:text-2xl text-ui-fg-muted"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
    </>
  )
}
