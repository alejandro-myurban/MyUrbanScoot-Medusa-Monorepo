"use client"

import { Popover, Transition } from "@headlessui/react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/enhanced-sheet"
import { Button } from "@medusajs/ui"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"
import { ShoppingBag, ShoppingCart, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import ItemsTemplate from "@modules/cart/templates/items"
import Summary from "@modules/cart/templates/summary"
import EmptyCartMessage from "@modules/cart/components/empty-cart-message"
import SignInPrompt from "@modules/cart/components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import CompactItemsTemplate from "@/modules/cart/templates/items-two"

const CartDropdown = ({
  cart: cartState,
  customer,
  dark,
}: {
  cart?: HttpTypes.StoreCart | null
  customer?: HttpTypes.StoreCustomer | null
  dark?: boolean
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
  }, [totalItems, itemRef.current])

  const getVariantImage = (item: HttpTypes.StoreCartLineItem) => {
    const product = item.variant?.product
    if (!product || !product.images || !product.images.length) {
      return product?.thumbnail
    }

    const colorOption = item.variant?.options?.find(
      (opt) => opt.option?.title?.toLowerCase() === "color"
    )
    const colorValue = colorOption?.value?.toLowerCase()

    if (!colorValue) {
      return product?.thumbnail
    }

    const colorImages = product.images.filter((img: any) =>
      img.url.toLowerCase().includes(colorValue)
    )
    if (colorImages.length > 0) {
      return colorImages[0].url
    }

    return product?.thumbnail
  }

  console.log("CartDropdown RENDER", {
    totalItems,
    cartState
  })

  return (
    <div className="h-full z-50">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <div
          onMouseEnter={openAndCancel}
          onMouseLeave={close}
          className="relative"
        >
          <Popover className="relative h-full flex justify-center items-center">
            <Popover.Button className="h-full relative z-10">
              <SheetTrigger asChild>
                <button
                  className={`
                    group relative flex gap-2 items-center justify-center
                    transition-all duration-300 ease-out
                    hover:scale-110 active:scale-95
                    ${
                      dark
                        ? "text-white/80 hover:text-white"
                        : "text-black hover:text-gray-700"
                    }
                  `}
                  data-testid="nav-cart-link"
                >
                  <div className="relative">
                    <ShoppingBag className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12 focus:outline-none focus:ring-0 active:outline-none" />

                    {/* Badge animado */}
                    <div
                      className={`
                      absolute -top-2 -right-2 
                      flex items-center justify-center 
                      bg-gradient-to-r from-red-500 to-pink-500
                      rounded-full w-5 h-5 text-xs text-white font-bold
                      transition-all duration-300 ease-out
                      ${totalItems > 0 ? "scale-100" : "scale-0"}
                      group-hover:scale-110 group-hover:rotate-12
                      shadow-lg shadow-red-500/30
                    `}
                    >
                      {totalItems}
                    </div>

                    {/* Sparkle effect cuando hay items */}
                    {totalItems > 0 && (
                      <div className="absolute -top-1 -right-1 pointer-events-none opacity-0">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                      </div>
                    )}
                  </div>
                </button>
              </SheetTrigger>
            </Popover.Button>

            {/* Popover preview mejorado */}
            <Transition
              show={cartDropdownOpen && !isSheetOpen}
              as={Fragment}
              enter="transition ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-1"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-1"
            >
              <Popover.Panel
                static
                className={`
                  hidden small:block absolute top-[calc(100%+8px)] right-0 
                  bg-white/95 backdrop-blur-xl border border-gray-200/50
                  rounded-2xl shadow-2xl shadow-black/10
                  w-[420px] text-ui-fg-base overflow-hidden
                  ring-1 ring-black/5
                `}
                data-testid="nav-cart-dropdown"
              >
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200/50">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Vista Rápida
                  </h3>
                </div>

                {cartState && cartState.items?.length ? (
                  <>
                    <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
                      {cartState.items
                        .sort((a, b) => {
                          return (a.created_at ?? "") > (b.created_at ?? "")
                            ? -1
                            : 1
                        })
                        .slice(0, 3)
                        .map((item, index) => (
                          <div
                            className={`
                              flex gap-4 p-3 rounded-xl bg-white/50 border border-gray-100
                              hover:bg-white/80 transition-all duration-200
                              hover:shadow-md hover:scale-[1.02]
                              animate-in slide-in-from-right
                            `}
                            style={{ animationDelay: `${index * 100}ms` }}
                            key={item.id}
                            data-testid="cart-item"
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                              <Thumbnail
                                thumbnail={getVariantImage(item)}
                                images={item.variant?.product?.images}
                                size="square"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate text-sm">
                                {item.title}
                              </h4>
                              <LineItemOptions variant={item.variant} />
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">
                                  Qty: {item.quantity}
                                </span>
                                <LineItemPrice item={item} style="tight" />
                              </div>
                            </div>
                          </div>
                        ))}

                      {cartState.items.length > 3 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-gray-500">
                            +{cartState.items.length - 3} artículos más
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-800">
                          Subtotal
                        </span>
                        <span className="font-bold text-lg text-gray-900">
                          {convertToLocale({
                            amount: subtotal,
                            currency_code: cartState.currency_code,
                          })}
                        </span>
                      </div>
                      <LocalizedClientLink href="/checkout?step=address">
                        <Button
                          className={`
                            w-full bg-black/90 mb-4
                            hover:from-blue-700 hover:to-purple-700
                            text-white font-semibold py-3 rounded-xl
                            transition-all duration-300 ease-out
                            hover:scale-[1.02] hover:shadow-lg
                            active:scale-[0.98]
                          `}
                          size="large"
                        >
                          Ir a Pagar
                        </Button>
                      </LocalizedClientLink>

                      <SheetTrigger asChild>
                        <Button
                          className={`
                            w-full bg-black/90  
                            hover:from-blue-700 hover:to-purple-700
                            text-white font-semibold py-3 rounded-xl
                            transition-all duration-300 ease-out
                            hover:scale-[1.02] hover:shadow-lg
                            active:scale-[0.98]
                          `}
                          size="large"
                        >
                          Ver Carrito Completo
                        </Button>
                      </SheetTrigger>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                    {/* <LocalizedClientLink href="/">
                      <Button
                        onClick={close}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Explorar Productos
                      </Button>
                    </LocalizedClientLink> */}
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>

        {/* Sheet content con animaciones */}
        <SheetContent
          className="w-[90%] sm:max-w-xl border-l border-gray-200/50 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden"
          side="right"
        >
          <AnimatePresence>
            {isSheetOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                {/* Header animado */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                  className="pb-2 border-b border-gray-200/50 flex-shrink-0"
                >
                  <SheetTitle className="text-2xl text-left font-bold font-archivoBlack uppercase flex items-center gap-2">
                    <div className="text-black/90 flex items-center gap-2">
                      Tu Carrito
                      <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{
                          delay: 0.3,
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                      >
                        <ShoppingBag className="w-8 h-8 text-black/90" />
                      </motion.div>
                    </div>
                  </SheetTitle>
                  <SheetDescription className="text-gray-600">
                    {totalItems > 0 ? (
                      <span className="flex items-center gap-2">
                        {/* Comentado como en tu código original */}
                      </span>
                    ) : (
                      "Tu carrito está vacío"
                    )}
                  </SheetDescription>
                </motion.div>

                {/* Contenido principal */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pt-6">
                  {cartState?.items?.length ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="flex flex-col h-full gap-y-6 px-2 pb-6"
                    >
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.1,
                              delayChildren: 0.3,
                            },
                          },
                        }}
                        className="flex-1"
                      >
                        <CompactItemsTemplate
                          items={cartState?.items}
                          showQuantityControls={true}
                        />
                      </motion.div>

                      {cartState && cartState.region && (
                        <motion.div
                          initial={{ y: 100, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{
                            delay: 0.5,
                            duration: 0.6,
                            ease: "easeOut",
                          }}
                          className="border-t pt-4 mt-4 bg-white/80 backdrop-blur-sm rounded-t-xl -mx-6 px-6 animate-in slide-in-from-bottom duration-500"
                        >
                          <Summary
                            cart={cartState as any}
                            showDiscount={false}
                          />
                          {/* Botón de checkout */}
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="flex-1 flex items-center justify-center animate-in fade-in duration-500"
                    >
                      <EmptyCartMessage />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default CartDropdown
