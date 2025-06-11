import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import MobileCartItem from "@modules/cart/components/mobile-item" // Nuevo componente
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import SkeletonMobileLineItem from "@modules/skeletons/components/skeleton-mobile-line-item" // Nuevo skeleton

type ItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
}

const ItemsTemplate = ({ items }: ItemsTemplateProps) => {
  const sortedItems = items
    ? items.sort((a, b) => {
        return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      })
    : null

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] font-dmSans leading-[2.75rem]">Cart</Heading>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block">
        <Table className="font-dmSans">
          <Table.Header className="border-t-0">
            <Table.Row className="text-ui-fg-subtle  txt-medium-plus">
              <Table.HeaderCell className="!pl-0 font-dmSans">Item</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell className="font-dmSans">Quantity</Table.HeaderCell>
              <Table.HeaderCell className="hidden small:table-cell font-dmSans">
                Price
              </Table.HeaderCell>
              <Table.HeaderCell className="!pr-0 text-right font-dmSans">
                Total
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedItems
              ? sortedItems.map((item) => {
                  return <Item key={item.id} item={item} />
                })
              : repeat(5).map((i) => {
                  return <SkeletonLineItem key={i} />
                })}
          </Table.Body>
        </Table>
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {sortedItems
            ? sortedItems.map((item) => {
                return <MobileCartItem key={item.id} item={item} />
              })
            : repeat(5).map((i) => {
                return <SkeletonMobileLineItem key={i} />
              })}
        </div>
      </div>
    </div>
  )
}

export default ItemsTemplate