"use client"

import { HttpTypes } from "@medusajs/types"
import CompactItem from "@modules/cart/templates/item-compact"
import repeat from "@lib/util/repeat"
import SkeletonCompactItem from "@modules/skeletons/components/skeleton-compact-item"

type CompactItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
  maxItems?: number
  showQuantityControls?: boolean
}

const CompactItemsTemplate = ({ 
  items, 
  maxItems = 5,
  showQuantityControls = true
}: CompactItemsTemplateProps) => {
  const sortedItems = items
    ? items.sort((a, b) => {
        return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      })
    : null

  const displayItems = sortedItems || []
  const hasMoreItems = sortedItems && maxItems && sortedItems.length > maxItems

  return (
    <div className="space-y-3">
      {displayItems.length > 0
        ? displayItems.map((item, index) => (
            <CompactItem 
              key={item.id} 
              item={item} 
              showQuantityControls={showQuantityControls}
              index={index}
            />
          ))
        : repeat(3).map((i) => (
            <SkeletonCompactItem key={i} />
          ))
      }
      
      {hasMoreItems && (
        <div className="text-center py-3 border-t border-gray-200 bg-white/90 backdrop-blur-sm mt-4">
          <span className="text-sm text-gray-500 font-medium">
            +{(sortedItems?.length || 0) - maxItems} artículos más
          </span>
        </div>
      )}
    </div>
  )
}

export default CompactItemsTemplate