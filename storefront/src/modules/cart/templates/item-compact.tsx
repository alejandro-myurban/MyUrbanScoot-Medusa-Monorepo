"use client"

import { clx } from "@medusajs/ui"
import { updateLineItem, deleteLineItem, deleteRelatedItems } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getProductsById } from "@lib/data/products"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useEffect, useState } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"

type CompactItemProps = {
  item: HttpTypes.StoreCartLineItem
  showQuantityControls?: boolean
  index?: number
}

const CompactItem = ({ 
  item, 
  showQuantityControls = true,
  index = 0 
}: CompactItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(item.thumbnail)

  const { handle } = item.variant?.product ?? {}
  const productId = [item.product?.id]

  useEffect(() => {
    const getProductData = async () => {
      if (productId) {
        setLoading(true)
        try {
          const data = await getProductsById({
            ids: productId.filter(Boolean) as string[],
            regionId: "reg_01JSP4QGE8SADHTVCS3M91T6B2",
          })
          setProductData(data)
        } catch (err) {
          console.error("Error fetching product data:", err)
        } finally {
          setLoading(false)
        }
      }
    }

    getProductData()
  }, [])

  useEffect(() => {
    if (productData) {
      const newImageUrl = getVariantImage()
      setImageUrl(newImageUrl)
    }
  }, [productData])

  const getVariantImage = () => {
    const product = Array.isArray(productData) ? productData[0] : productData

    if (!product || !product.images || !product.images.length) {
      return item.thumbnail
    }

    const baseOption = item.variant?.options?.find(
      (opt) => (opt.option?.title)?.toLowerCase() === "base"
    )

    const baseValue = baseOption?.value?.toLowerCase()
    if (!baseValue) {
      return item.thumbnail
    }

    const baseKeyWord = baseValue.split(" ")[0]
    const regex = new RegExp(`\\b${baseKeyWord}\\b`, "i")
    const baseImages = product.images.filter((img: any) => regex.test(img.url))

    if (baseImages.length > 0) {
      return baseImages[0].url
    }

    return item.thumbnail
  }

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // Nueva función para eliminar el item correctamente
  const handleDelete = async () => {
    setError(null)
    setDeleting(true)
    
    try {
      await deleteRelatedItems(item.id)
      await deleteLineItem(item.id)
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const incrementQuantity = () => {
    if (item.quantity < 10) {
      changeQuantity(item.quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (item.quantity > 1) {
      changeQuantity(item.quantity - 1)
    }
  }

  return (
    <div 
      className={clx(
        "group flex gap-3 p-3 rounded-xl border transition-all duration-200",
        "hover:shadow-md hover:scale-[1.01] bg-white/70 backdrop-blur-sm",
        "border-gray-200/60 hover:border-gray-300/80",
        "animate-in slide-in-from-left"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid="compact-cart-item"
    >
      {/* Imagen del producto */}
      <div className="relative flex-shrink-0">
        <LocalizedClientLink href={`/products/${handle}`}>
          {loading ? (
            <div className="w-16 h-16 flex items-center justify-center border rounded-lg bg-gray-100">
              <Spinner />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 hover:shadow-md transition-shadow duration-200">
              <Thumbnail
                thumbnail={imageUrl}
                images={productData?.images || []}
                size="square"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </LocalizedClientLink>

        {/* Badge de cantidad */}
        <div className="absolute -top-2 -right-2 bg-black/90 font-archivo text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg z-10">
          {item.quantity}
        </div>
      </div>

      {/* Contenido del item */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Título y precio */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 text-sm truncate leading-tight">
              {item.product_title}
            </h4>
            <div className="mt-1">
              <LineItemOptions variant={item.variant} />
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <LineItemPrice item={item} style="tight" />
          </div>
        </div>

        {/* Controles de cantidad y eliminar */}
        {showQuantityControls && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm">
                <button
                  onClick={decrementQuantity}
                  disabled={item.quantity <= 1 || updating || deleting}
                  className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                >
                  <Minus className="w-3 h-3" />
                </button>
                
                <span className="px-3 py-1.5 text-sm font-medium min-w-[2rem] text-center">
                  {item.quantity}
                </span>
                
                <button
                  onClick={incrementQuantity}
                  disabled={item.quantity >= 10 || updating || deleting}
                  className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {(updating || deleting) && (
                <div className="flex items-center justify-center">
                  <Spinner />
                </div>
              )}
            </div>

            {/* Botón eliminar corregido */}
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group/delete"
              disabled={updating || deleting}
            >
              {deleting ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-2">
            <ErrorMessage error={error} />
          </div>
        )}
      </div>
    </div>
  )
}

export default CompactItem