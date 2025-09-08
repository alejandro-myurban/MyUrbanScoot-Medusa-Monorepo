export interface JsonLdProps {
  data: Record<string, any>
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Schema generators
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MyUrbanScoot",
  description: "Tu tienda online especializada en repuestos y accesorios para patinetes eléctricos",
  url: "https://myurbanscoot.com",
  logo: "https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Spanish", "French", "German", "Italian", "Portuguese"]
  },
  sameAs: [
    // Añade aquí tus redes sociales
    // "https://facebook.com/myurbanscoot",
    // "https://instagram.com/myurbanscoot"
  ]
})

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MyUrbanScoot",
  description: "Todo para tu patinete eléctrico",
  url: "https://myurbanscoot.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://myurbanscoot.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
})

export const generateProductSchema = (product: any, region: any) => {
  const prices = product.variants?.map((v: any) => v.calculated_price?.calculated_amount || 0) || []
  const minPrice = prices.length > 0 ? Math.min(...prices) / 100 : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) / 100 : 0

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    image: product.images?.map((img: any) => img.url) || [],
    brand: {
      "@type": "Brand",
      name: product.metadata?.brand || "MyUrbanScoot"
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: region.currency_code?.toUpperCase() || "EUR",
      lowPrice: minPrice.toString(),
      highPrice: maxPrice.toString(),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "MyUrbanScoot"
      }
    },
    category: product.categories?.[0]?.name || "Patinetes Eléctricos",
    ...(product.metadata?.gtin && { gtin: product.metadata.gtin }),
    ...(product.metadata?.mpn && { mpn: product.metadata.mpn }),
    ...(product.metadata?.sku && { sku: product.metadata.sku })
  }
}

export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string, url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: crumb.url
  }))
})

export const generateCategorySchema = (category: any, products: any[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: category.name,
  description: category.description || `Productos de ${category.name}`,
  url: `https://myurbanscoot.com/categories/${category.handle}`,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.title,
        url: `https://myurbanscoot.com/producto/${product.handle}`
      }
    }))
  }
})