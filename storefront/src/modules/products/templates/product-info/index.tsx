'use client'

import { HttpTypes } from '@medusajs/types'
import { Heading, Text } from '@medusajs/ui'
import LocalizedClientLink from '@modules/common/components/localized-client-link'
import { ProductAverageReview } from '@modules/product-reviews/components/ProductAverageReview'
import ReviewButton from '@modules/product-reviews/components/ReviewButton'
import Accordion from '@modules/products/components/product-info-accordion'
import CompatibleScooters from '../../components/product-compatible/compatible-scooters'
import { useTranslation } from 'react-i18next'

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { t } = useTranslation('ProductInfo')

  const hasCompatibleCategory = product.categories?.some(
    (c) => c.handle === 'vinilos' || c.handle === 'modelos'
  )

  const accordionItems = [
    ...(hasCompatibleCategory
      ? [
          {
            id: 'modelos-compatibles',
            title: t('compatibleModels'),
            content: <CompatibleScooters product={product} />,
          },
        ]
      : []),
    {
      id: 'ver-detalles',
      title: t('viewDetails'),
      content: (
        <div>
          <ul className="mt-2 space-y-1">
            <Text
              className="text-medium text-ui-fg-subtle font-dmSans py-2 max-h-32 overflow-y-auto transition-all duration-200 hover:max-h-48"
              data-testid="product-description"
              asChild
            >
              <div
                dangerouslySetInnerHTML={{ __html: product.description || '' }}
                className="whitespace-pre-line rich-text-content"
              />
            </Text>
          </ul>
        </div>
      ),
    },
    {
      id: 'envio-devoluciones',
      title: t('shippingAndReturns'),
      content: (
        <div>
          <p>
            <strong>{t('shippingInformation')}:</strong>
          </p>
          <ul className="mt-2 space-y-1">
            <li>• {t('freeShipping')}</li>
            <li>• {t('deliveryTime')}</li>
            <li>• {t('freeReturns')}</li>
            <li>• {t('warranty')}</li>
          </ul>
        </div>
      ),
    },
  ]

  const rawPrices: number[] =
    product.variants
      ?.map((v) => v.calculated_price?.calculated_amount)
      .filter(
        (amount): amount is number =>
          typeof amount === 'number' && !isNaN(amount)
      ) ?? []

  const minAmount = rawPrices.length > 0 ? Math.min(...rawPrices) : 0
  const maxAmount = rawPrices.length > 0 ? Math.max(...rawPrices) : 0

  const minPrice = (minAmount / 100).toFixed(2)
  const maxPrice = (maxAmount / 100).toFixed(2)

  const priceText =
    rawPrices.length === 0
      ? t('priceNotAvailable')
      : minAmount === maxAmount
      ? t('singlePrice', { price: minPrice })
      : t('priceRange', { minPrice, maxPrice })

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}

        <ProductAverageReview productId={product.id} />

        <Heading
          level="h2"
          className="text-2xl sm:text-3xl leading-10 uppercase font-archivoBlack font-bold text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="text-2xl font-semibold font-archivoBlack text-ui-fg-base"
          data-testid="product-price"
        >
          {priceText}
        </Text>

        <Accordion
          className="font-archivo text-gray-500"
          items={accordionItems}
        />

        <ReviewButton product={product} className="text-sm" />
      </div>
    </div>
  )
}

const RichTextStyles = `
  .rich-text-content {
    line-height: 1.6;
  }
  .rich-text-content p {
    margin-bottom: 1rem;
  }
  .rich-text-content h1,
  .rich-text-content h2,
  .rich-text-content h3,
  .rich-text-content h4,
  .rich-text-content h5,
  .rich-text-content h6 {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  .rich-text-content a {
    color: #3182ce;
    text-decoration: underline;
  }
  .rich-text-content strong,
  .rich-text-content b {
    font-weight: bold;
  }
  .rich-text-content em,
  .rich-text-content i {
    font-style: italic;
  }
  .rich-text-content ul,
  .rich-text-content ol {
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
`

if (typeof window !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.textContent = RichTextStyles
  document.head.appendChild(styleTag)
}

export default ProductInfo