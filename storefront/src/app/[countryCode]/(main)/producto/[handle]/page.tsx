import { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductTemplate from "@modules/products/templates"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { 
  StoreProductWithTranslations,
  StoreProductOptionWithTranslations,
  StoreProductOptionValueWithTranslations,
  hasTranslations
} from "../../../../../types/medusa-extend"

// SSG PURO - Comentado ISR para prueba
// export const revalidate = 86400

type Props = {
  params: { countryCode: string; handle: string }
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then(
    (regions) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  if (!countryCodes) {
    return null
  }

  const products = await Promise.all(
    countryCodes.map((countryCode) => {
      return getProductsList({ countryCode })
    })
  ).then((responses) =>
    responses.map(({ response }) => response.products).flat()
  )

  const staticParams = countryCodes
    ?.map((countryCode) =>
      products.map((product) => ({
        countryCode,
        handle: product.handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const selectedCountry = region.countries?.find(
    (c) => c.iso_2 === params.countryCode
  )

  if (!selectedCountry) {
    notFound()
  }

  const product = await getProductByHandle(
    handle,
    region.id,
    params.countryCode
  )

  if (!product) {
    notFound()
  }

  // Type-safe access to translations
  const productWithTranslations = product as StoreProductWithTranslations
  const title = hasTranslations(productWithTranslations)
    ? productWithTranslations.translations?.title || productWithTranslations.title
    : product.title
    
  const description = hasTranslations(productWithTranslations)
    ? productWithTranslations.translations?.description || productWithTranslations.description || productWithTranslations.title
    : product.description || product.title

  return {
    title: `${title} | MyUrbanScoot`,
    description: `${description}`,
    openGraph: {
      title: `${title} | MyUrbanScoot`,
      description: `${description}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const selectedCountry = region.countries?.find(
    (c) => c.iso_2 === params.countryCode
  )

  if (!selectedCountry) {
    notFound()
  }

  const countryCodeGb = params.countryCode === "gb" ? "en" : params.countryCode

  const pricedProduct = await getProductByHandle(
    params.handle,
    region.id,
    countryCodeGb
  )

  if (!pricedProduct) {
    notFound()
  }

  // Cast to our extended type for better type safety
  const productWithPotentialTranslations = pricedProduct as StoreProductWithTranslations

  // Process translations with type safety
  const translatedOptions: StoreProductOptionWithTranslations[] | undefined = 
    productWithPotentialTranslations.options?.map((option) => {
      const optionWithTranslations = option as StoreProductOptionWithTranslations
      
      return {
        ...optionWithTranslations,
        title: optionWithTranslations.translations?.title || optionWithTranslations.title,
        values: optionWithTranslations.values?.map((value) => {
          const valueWithTranslations = value as StoreProductOptionValueWithTranslations
          return {
            ...valueWithTranslations,
            // Use value.translations.value for the label
            label: valueWithTranslations.translations?.value || valueWithTranslations.value,
          }
        }),
      }
    })

  // Create the final translated product with proper typing
  const translatedProduct: StoreProductWithTranslations = {
    ...productWithPotentialTranslations,
    title: productWithPotentialTranslations.translations?.title || productWithPotentialTranslations.title,
    description: productWithPotentialTranslations.translations?.description || productWithPotentialTranslations.description,
    subtitle: productWithPotentialTranslations.translations?.subtitle || productWithPotentialTranslations.subtitle,
    options: translatedOptions || null,
  }

  return (
    <>
      <ProductTemplate
        product={translatedProduct}
        region={region}
        countryCode={params.countryCode}
      />
    </>
  )
}