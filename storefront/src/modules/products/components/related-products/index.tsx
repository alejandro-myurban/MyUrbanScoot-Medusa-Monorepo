import Product from "../product-preview"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

type StoreProductParamsWithTags = HttpTypes.StoreProductParams & {
  tags?: string[]
}

type StoreProductWithTags = HttpTypes.StoreProduct & {
  tags?: { value: string }[]
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    const queryParams: StoreProductParamsWithTags = {}
  }

  // edit this function to define your related products logic
  const queryParams: StoreProductParamsWithTags = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  const productWithTags = product as StoreProductWithTags
  if (productWithTags.tags) {
    queryParams.tags = productWithTags.tags
      .map((t) => t.value)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await getProductsList({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return (
      response.products
        .filter((responseProduct) => responseProduct.id !== product.id)
        // Filtrar productos que tengan comisión activada
        .filter(
          (responseProduct) =>
            responseProduct.metadata?.comision !== true &&
            responseProduct.metadata?.comision !== "true"
        )
    )
  })

  console.log(products)

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint font-archiveBlack ">
      <div className="flex flex-col gap-4 py-6">
        <span className="text-base-regular text-ui-fg-base font-archivoBlack uppercase">
          Te puede interesar
        </span>
      </div>

      <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-4 gap-x-6 gap-y-8 -z-20 pb-4">
        {products.map((product) => (
          <li key={product.id}>
            {region && <Product region={region} product={product} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
