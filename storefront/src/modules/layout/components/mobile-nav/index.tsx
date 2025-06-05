"use client"
import { useState } from "react"
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  UserCircleIcon,
  ShoppingBag,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../src/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../src/components/ui/collapsible"

interface MobileMenuProps {
  categories: any[]
  isDark: boolean
}

export default function MobileMenu({ categories, isDark }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [openBrands, setOpenBrands] = useState<string[]>([])

  const vinylsCategory = categories[0]
  const brands = vinylsCategory?.category_children || []

  const handleLinkClick = () => {
    setIsOpen(false)
    setIsCategoriesOpen(false)
    setOpenBrands([])
  }

  const toggleBrand = (brandId: string) => {
    setOpenBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    )
  }

  const textColor = isDark ? "text-white" : "text-black"
  const textColorSecondary = isDark ? "text-white/80" : "text-black/80"
  const hoverColor = isDark ? "hover:text-white" : "hover:text-black"
  const bgColor = isDark ? "bg-black/50" : "bg-white/75"
  const borderColor = isDark ? "border-gray-800" : "border-gray-200"

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={`${textColor} ${hoverColor} p-2 space-y-0 transition-colors duration-200`}
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className={`w-full sm:w-3/4 md:2/4 lg:1/4 ${bgColor} backdrop-blur-md ${borderColor} border-r`}
      >
        <SheetHeader className="text-left flex justify-between space-y-0 flex-row items-center">
          <SheetTitle className={`${textColor} text-xl font-bold `}>
            Menú
          </SheetTitle>
          {/* Botón de Cierre */}
          <button
            onClick={() => setIsOpen(false)}
            className={`${textColor} hover:${hoverColor}  m-0 transition-all duration-200`}
            aria-label="Cerrar menú"
          >
            <X className="w-10 h-10" />
          </button>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Logo */}
          <div className="pb-6 border-b border-gray-200/20">
            <img
              className="transition-all object-cover duration-200 hover:scale-105"
              src="/logomys.png"
              alt="MyUrbanScoot Logo"
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4">
            <div className="flex gap-2 justify-center items-center">
              <LocalizedClientLink
                href="/account"
                onClick={handleLinkClick}
                className={`${textColorSecondary} ${hoverColor} flex gap-2 font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
              >
                <UserCircleIcon /> Mi Cuenta
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/account"
                onClick={handleLinkClick}
                className={`${textColorSecondary} ${hoverColor} flex gap-2 font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
              >
                <ShoppingBag /> Ver Carro
              </LocalizedClientLink>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-200/20 pt-6"></div>
            {/* Blog */}
            <LocalizedClientLink
              href="/category/noticias-patinete-electrico"
              onClick={handleLinkClick}
              className={`${textColorSecondary} ${hoverColor} block py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
            >
              <span className="text-lg font-medium">Blog</span>
            </LocalizedClientLink>

            {/* Vinilos - Collapsible */}
            <Collapsible
              open={isCategoriesOpen}
              onOpenChange={setIsCategoriesOpen}
            >
              <CollapsibleTrigger
                className={`${textColorSecondary} ${hoverColor} flex items-center justify-between w-full py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
              >
                <span className="text-lg font-medium">
                  {vinylsCategory?.name || "Vinilos"}
                </span>
                {isCategoriesOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 ml-4 space-y-2">
                {/* Marcas (Kugoo, Dualtron, etc.) */}
                {brands?.map((brand: any) => (
                  <div key={brand.id}>
                    {/* Si la marca tiene modelos, la hacemos collapsible */}
                    {brand.category_children &&
                    brand.category_children.length > 0 ? (
                      <Collapsible
                        open={openBrands.includes(brand.id)}
                        onOpenChange={() => toggleBrand(brand.id)}
                      >
                        <div className="flex items-center">
                          <LocalizedClientLink
                            href={`/categories/${brand.handle}`}
                            onClick={handleLinkClick}
                            className={`${textColorSecondary} ${hoverColor} w-1/2 flex-1 py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-base font-medium`}
                          >
                            {brand.name}
                          </LocalizedClientLink>
                          <CollapsibleTrigger
                            className={`${textColorSecondary} ${hoverColor} w-1/2 flex justify-end p-2`}
                          >
                            {openBrands.includes(brand.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent className="ml-4 mt-1 space-y-1">
                          {/* Modelos */}
                          {brand.category_children.map((model: any) => (
                            <LocalizedClientLink
                              key={model.id}
                              href={`/categories/${model.handle}`}
                              onClick={handleLinkClick}
                              className={`${textColorSecondary} ${hoverColor} block py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-sm`}
                            >
                              {model.name}
                            </LocalizedClientLink>
                          ))}

                          {/* Ver todo en marca */}
                          <LocalizedClientLink
                            href={`/categories/${brand.handle}`}
                            onClick={handleLinkClick}
                            className={`${textColorSecondary} ${hoverColor} block py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-sm italic border-t ${borderColor} mt-2 pt-2`}
                          >
                            Ver todo en {brand.name}
                          </LocalizedClientLink>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      // Marca sin modelos - solo un link simple
                      <LocalizedClientLink
                        href={`/categories/${brand.handle}`}
                        onClick={handleLinkClick}
                        className={`${textColorSecondary} ${hoverColor} block py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-base font-medium`}
                      >
                        {brand.name}
                      </LocalizedClientLink>
                    )}
                  </div>
                ))}

                {/* Ver todos los vinilos */}
                <LocalizedClientLink
                  href={`/categories/${vinylsCategory?.handle || "vinilos"}`}
                  onClick={handleLinkClick}
                  className={`${textColorSecondary} ${hoverColor} block py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-sm italic border-t ${borderColor} mt-2 pt-2`}
                >
                  Ver todos los vinilos
                </LocalizedClientLink>
              </CollapsibleContent>
            </Collapsible>

            {/* Recambios */}
            <LocalizedClientLink
              href="/spare-parts"
              onClick={handleLinkClick}
              className={`${textColorSecondary} ${hoverColor} block py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
            >
              <span className="text-lg font-medium">Recambios</span>
            </LocalizedClientLink>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
