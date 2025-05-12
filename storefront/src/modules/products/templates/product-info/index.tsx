import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ProductAverageReview } from "@modules/product-reviews/components/ProductAverageReview"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>
        <ProductAverageReview productId={product.id} />
        <Text
          className="text-medium text-ui-fg-subtle"
          data-testid="product-description"
          asChild
        >
          <div 
            dangerouslySetInnerHTML={{ __html: product.description || "" }}
            className="whitespace-pre-line rich-text-content"
          />
        </Text>
      </div>
    </div>
  )
}

// Estilos globales para contenido HTML rico
const RichTextStyles = `
  .rich-text-content {
    line-height: 1.6;
  }
  .rich-text-content p {
    margin-bottom: 1rem;
  }
  .rich-text-content h1, .rich-text-content h2, 
  .rich-text-content h3, .rich-text-content h4, 
  .rich-text-content h5, .rich-text-content h6 {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  .rich-text-content a {
    color: #3182ce;
    text-decoration: underline;
  }
  .rich-text-content strong, .rich-text-content b {
    font-weight: bold;
  }
  .rich-text-content em, .rich-text-content i {
    font-style: italic;
  }
  .rich-text-content ul, .rich-text-content ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }
  .rich-text-content ul {
    list-style-type: disc;
  }
  .rich-text-content ol {
    list-style-type: decimal;
  }
  .rich-text-content code {
    background-color: #f1f1f1;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: monospace;
  }
  .rich-text-content blockquote {
    border-left: 4px solid #cbd5e0;
    padding-left: 1rem;
    font-style: italic;
    color: #4a5568;
  }
`;

// Añade los estilos globales
if (typeof window !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = RichTextStyles;
  document.head.appendChild(styleTag);
}

export default ProductInfo