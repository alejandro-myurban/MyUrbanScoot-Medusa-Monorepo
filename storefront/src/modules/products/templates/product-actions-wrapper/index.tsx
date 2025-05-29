import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */

export default async function ProductActionsWrapper({
  id,
  region,
  countryCode,
}: {
  id: string
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const [product] = await getProductsById({
    ids: [id],
    regionId: region.id,
    countryCode,
  })

  if (!product) {
    return null
  }

  // console.log(
  //   "All images + thumbnails:",
  //   product.variants?.map((v) => [v.metadata?.thumbnail, ...((v.metadata?.images as string[]) || [])])
  // )

  return (
    <ProductActions
      product={{ ...product, options: product.options || null }}
      region={region}
    />
  )
}
