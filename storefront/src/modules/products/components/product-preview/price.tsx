import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <>
      <Text
        className={clx("text-black font-archivoBlack text-base  sm:text-2xl font-bold", {
          "text-black text-base  sm:text-2xl font-archivoBlack ": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
      {price.price_type === "sale" && (
        <Text
          className="line-through font-archivoBlack text-base  sm:text-2xl text-ui-fg-muted"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
    </>
  )
}
