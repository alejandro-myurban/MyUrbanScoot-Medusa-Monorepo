"use client"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { Trash2 } from "lucide-react"

import Thumbnail from "@modules/products/components/thumbnail"
import Spinner from "@modules/common/icons/spinner"
import { useState } from "react"
import { updateLineItem } from "@lib/data/cart"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"

type MobileCartItemProps = {
  item: HttpTypes.StoreCartLineItem
}

const MobileCartItem = ({ item }: MobileCartItemProps) => {
  const [updating, setUpdating] = useState(false)

  const changeQuantity = async (quantity: number) => {
    setUpdating(true)
    const message = await updateLineItem({
      lineId: item.id,
      quantity,
    })
    setUpdating(false)
    return message
  }

  return (
    <div className="border border-ui-border-base rounded-lg p-3 bg-ui-bg-subtle">
      {/* Fila 1: Título completo y botón eliminar */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <Text className="text-ui-fg-base font-medium leading-tight">
            {item.product_title}
          </Text>
        </div>
        <div className="flex-shrink-0">
          <DeleteButton
            id={item.id}
            data-testid="mobile-cart-item-remove-button"
            className="text-ui-fg-subtle hover:text-ui-fg-error p-1 hover:bg-ui-bg-subtle-hover rounded"
          />
        </div>
      </div>

      {/* Fila 2: Variant (si existe) */}
      {item.variant && (
        <div className="mb-3">
          <div className="inline-block">
            <LineItemOptions
              variant={item.variant}
              data-testid="mobile-product-variant"
            />
          </div>
        </div>
      )}

      {/* Fila 3: Imagen, cantidad y precio */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Imagen más pequeña */}
          <div className="flex-shrink-0">
            <Thumbnail
              thumbnail={item.variant?.product?.thumbnail}
              images={item.variant?.product?.images}
              size="square"
              className="w-20 h-12 object-contain"
            />
          </div>
          
          {/* Controles de cantidad */}
          <div className="flex items-center border border-ui-border-base rounded bg-ui-bg-base">
            <button
              className="px-2 py-1 hover:bg-ui-bg-subtle-hover disabled:opacity-50"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
            >
              <Text size="small">−</Text>
            </button>
            
            <div className="px-2 py-1 min-w-[2rem] text-center relative">
              {updating ? (
                <Spinner className="animate-spin" />
              ) : (
                <Text size="small" className="font-medium">
                  {item.quantity}
                </Text>
              )}
            </div>
            
            <button
              className="px-2 py-1 hover:bg-ui-bg-subtle-hover disabled:opacity-50"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={updating}
            >
              <Text size="small">+</Text>
            </button>
          </div>
        </div>

        {/* Precios */}
        <div className="text-right">
          <div className="text-ui-fg-base font-semibold">
            <LineItemPrice item={item} style="tight" />
          </div>
          <div className="text-ui-fg-subtle">
            <LineItemUnitPrice item={item} style="tight" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileCartItem