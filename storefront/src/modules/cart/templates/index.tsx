import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/src/components/ui/sheet"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const itemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Tu Carrito</SheetTitle>
          <SheetDescription>
            {itemCount > 0 ? `${itemCount} artículo${itemCount > 1 ? 's' : ''} en tu carrito` : 'Tu carrito está vacío'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {cart?.items?.length ? (
            <div className="flex flex-col gap-y-6 flex-1">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              
              <div className="flex-1 overflow-y-auto">
                <ItemsTemplate items={cart?.items} />
              </div>
              
              {cart && cart.region && (
                <div className="border-t pt-4 mt-4">
                  <Summary cart={cart as any} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyCartMessage />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CartTemplate