import { getProductsByTagName } from "@lib/data/products"
import type { StoreProduct } from "@medusajs/types"

interface TagPageProps {
  params: { tagName: string; countryCode: string }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagName } = params
  const { products } = await getProductsByTagName({ tagName })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        Productos con la etiqueta: {tagName}
      </h1>
      {products.length === 0 ? (
        <p>No se encontraron productos con esta etiqueta.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: StoreProduct) => (
            <li key={product.id} className="border rounded p-4">
              {product.thumbnail && (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-48 object-cover mb-3"
                />
              )}
              <h2 className="font-semibold">{product.title}</h2>
              {product.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
