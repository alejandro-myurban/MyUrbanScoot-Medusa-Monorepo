"use client"
import { useState } from "react"
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  UserCircleIcon,
  ShoppingBag,
  MessageCircleQuestion,
  Info,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../src/components/ui/sheet"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import SearchModal from "@modules/search-algolia/components/modal"
import LanguageSwitcher from "../language-switcher"
import { useTranslation } from "react-i18next"

interface MobileMenuProps {
  categories: any[]
  isDark: boolean
}

// Variantes de animación optimizadas
const collapsibleVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    overflow: "hidden" as const,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  visible: {
    opacity: 1,
    height: "auto" as const,
    overflow: "visible" as const,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    overflow: "hidden" as const,
    transition: {
      duration: 0.15,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15,
    },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: [0.0, 0.0, 0.2, 1],
    },
  },
}

const linkVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 5,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.0, 0.0, 0.2, 1],
    },
  },
}

export default function MobileMenu({ categories, isDark }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [openBrands, setOpenBrands] = useState<string[]>([])
  const { t } = useTranslation()

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

  const textColor = isDark ? "text-white" : "text-black/80"
  const textColorSecondary = isDark ? "text-white/80" : "text-white/80"
  const hoverColor = isDark ? "hover:text-white" : "hover:text-white"
  const bgColor = isDark ? "bg-black/50" : "bg-black/50"
  const borderColor = isDark ? "border-gray-800" : "border-gray-800"
  const i18nColor = isDark ? "text-white/90" : "text-white/90"

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
        className={`w-full sm:w-3/4 md:2/4 lg:1/4 ${bgColor} backdrop-blur-md ${borderColor} border-r flex flex-col`}
      >
        {/* Header fijo */}
        <SheetHeader className="text-left flex justify-between space-y-0 flex-row items-center flex-shrink-0 pb-4 border-b border-gray-200/20">
          <SheetTitle className={`${textColor} text-xl font-bold`}>
            <motion.div
              className=""
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
            >
              <img
                className="transition-all object-cover duration-200 w-48 hover:scale-105"
                src="/logomyswide.png"
                alt="MyUrbanScoot Logo"
              />
            </motion.div>
          </SheetTitle>
          <div className="flex items-center gap-3">
            {/* Language Switcher en header - más accesible */}
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <LanguageSwitcher color={i18nColor} />
            </motion.div>

            <motion.button
              onClick={() => setIsOpen(false)}
              className={`text-white/80 hover:${hoverColor} m-0 transition-all duration-200`}
              aria-label="Cerrar menú"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-8 h-8" />
            </motion.button>
          </div>
        </SheetHeader>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden mt-2 pr-2 pb-6">
          <div className="space-y-6">
            {/* Logo con animación */}
            {/* <motion.div
              className="pb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
            >
              <img
                className="transition-all object-cover duration-200 hover:scale-105"
                src="/logomys.png"
                alt="MyUrbanScoot Logo"
              />
            </motion.div> */}

            {/* Barra de búsqueda - Posición prominent */}
            <motion.div
              className="pb-2 border-b border-gray-200/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
            >
              <div className="space-y-2">
                <p className={`text-sm ${textColorSecondary} font-medium`}>
                  ¿Qué buscas?
                </p>
                <div className="relative z-[10000] w-full">
                  <SearchModal dark={true} />
                </div>
              </div>
            </motion.div>
            <motion.div
              className="pb-2 border-b border-gray-200/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="space-y-2">
                <p className={`text-sm ${textColorSecondary} font-medium`}>
                  ¿Necesitas ayuda?
                </p>
                <div className="relative z-[10000] w-full">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LocalizedClientLink
                      className={`hover:text-ui-fg-base text-base py-2 px-3 font-semibold flex gap-2 transition-all duration-200 hover:bg-gray-100/10 rounded-lg ${
                        isDark
                          ? "text-white/80 hover:text-white"
                          : "text-white/80"
                      }`}
                      href="/contact"
                      onClick={handleLinkClick}
                      scroll={false}
                      data-testid="nav-search-link"
                    >
                      <Info className="w-6 h-6"  />
                      {t("navigation.contact")}
                    </LocalizedClientLink>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Navigation Links */}
            <nav className="space-y-4">
              {/* Vinilos - Collapsible con animación */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
                <motion.div
                  className={`${textColorSecondary} ${hoverColor} flex items-center justify-between w-full py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* 50% izquierdo - Link */}
                  <div className="flex-1">
                    <LocalizedClientLink
                      href="/categories/vinilos"
                      onClick={handleLinkClick}
                      className="text-base font-semibold block w-full h-full"
                    >
                      {vinylsCategory?.name || "Vinilos"}
                    </LocalizedClientLink>
                  </div>

                  {/* 50% derecho - Toggle */}
                  <div
                    className="flex-1 flex justify-end cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsCategoriesOpen(!isCategoriesOpen)
                    }}
                  >
                    <motion.div
                      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                    >
                      {isCategoriesOpen ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isCategoriesOpen && (
                    <motion.div
                      variants={collapsibleVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mt-2 ml-4 space-y-2"
                    >
                      {/* Marcas (Kugoo, Dualtron, etc.) */}
                      {brands?.map((brand: any, index: number) => (
                        <motion.div
                          key={brand.id}
                          variants={itemVariants}
                          custom={index}
                        >
                          {/* Si la marca tiene modelos, la hacemos collapsible */}
                          {brand.category_children &&
                          brand.category_children.length > 0 ? (
                            <div>
                              <motion.div
                                className={`${textColorSecondary} ${hoverColor} flex items-center py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5`}
                                whileTap={{ scale: 0.98 }}
                              >
                                {/* 50% izquierdo - Link */}
                                <div className="flex-1">
                                  <LocalizedClientLink
                                    href={`/categories/${brand.handle}`}
                                    onClick={handleLinkClick}
                                    className="font-semibold text-base block w-full h-full"
                                  >
                                    {brand.name}
                                  </LocalizedClientLink>
                                </div>

                                {/* 50% derecho - Toggle */}
                                <div
                                  className="flex-1 flex justify-end cursor-pointer p-2"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    toggleBrand(brand.id)
                                  }}
                                >
                                  <motion.div
                                    transition={{
                                      duration: 0.2,
                                      ease: [0.4, 0.0, 0.2, 1],
                                    }}
                                  >
                                    {openBrands.includes(brand.id) ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </motion.div>
                                </div>
                              </motion.div>

                              <AnimatePresence>
                                {openBrands.includes(brand.id) && (
                                  <motion.div
                                    variants={collapsibleVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="ml-4 mt-1 space-y-1"
                                  >
                                    {/* Modelos */}
                                    {brand.category_children.map(
                                      (model: any, modelIndex: number) => (
                                        <motion.div
                                          key={model.id}
                                          variants={itemVariants}
                                          custom={modelIndex}
                                        >
                                          <LocalizedClientLink
                                            href={`/categories/${model.handle}`}
                                            onClick={handleLinkClick}
                                            className={`${textColorSecondary} ${hoverColor} block py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-sm`}
                                          >
                                            {model.name}
                                          </LocalizedClientLink>
                                        </motion.div>
                                      )
                                    )}

                                    {/* Ver todo en marca */}
                                    <motion.div
                                      variants={itemVariants}
                                      custom={brand.category_children.length}
                                      className={`border-t ${borderColor} mt-2 pt-2`}
                                    >
                                      <LocalizedClientLink
                                        href={`/categories/${brand.handle}`}
                                        onClick={handleLinkClick}
                                        className={`${textColorSecondary} ${hoverColor} block py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-sm italic`}
                                      >
                                        Ver todo en {brand.name}
                                      </LocalizedClientLink>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
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
                        </motion.div>
                      ))}

                      {/* Ver todos los vinilos */}
                      <motion.div
                        variants={itemVariants}
                        custom={brands.length}
                        className={`border-t ${borderColor} mt-2 pt-2`}
                      >
                        <LocalizedClientLink
                          href={`/categories/${
                            vinylsCategory?.handle || "vinilos"
                          }`}
                          onClick={handleLinkClick}
                          className={`${textColorSecondary} ${hoverColor} block py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-sm italic`}
                        >
                          Ver todos los vinilos
                        </LocalizedClientLink>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Recambios con animación */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                whileTap={{ scale: 0.98 }}
              >
                <LocalizedClientLink
                  href="/spare-parts"
                  onClick={handleLinkClick}
                  className={`${textColorSecondary} ${hoverColor} flex justify-between py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                >
                  <span className="text-base font-semibold">Recambios</span>
                  <ChevronRight className="w-5 h-5 inline-block ml-2" />
                </LocalizedClientLink>
              </motion.div>

              {/* Patinetes Eléctricos con animación */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.25 }}
                whileTap={{ scale: 0.98 }}
              >
                <LocalizedClientLink
                  href="/categories/patinetes-electricos"
                  onClick={handleLinkClick}
                  className={`${textColorSecondary} ${hoverColor} flex justify-between py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                >
                  <span className="text-base font-semibold">
                    Patinetes Eléctricos
                  </span>
                  <ChevronRight className="w-5 h-5 inline-block ml-2" />
                </LocalizedClientLink>
              </motion.div>

              {/* Zona Circuito con animación */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
                whileTap={{ scale: 0.98 }}
              >
                <LocalizedClientLink
                  href="/categories/patinetes-electricos"
                  onClick={handleLinkClick}
                  className={`${textColorSecondary} ${hoverColor} flex justify-between py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                >
                  <span className="text-base font-semibold">Zona Circuito</span>
                  <ChevronRight className="w-5 h-5 inline-block ml-2" />
                </LocalizedClientLink>
              </motion.div>

              {/* FAQ con animación */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.35 }}
                whileTap={{ scale: 0.98 }}
              >
                <LocalizedClientLink
                  href="/help-center"
                  onClick={handleLinkClick}
                  className={`${textColorSecondary} ${hoverColor} flex justify-between py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                >
                  <span className="text-base font-semibold">FAQ</span>
                  <ChevronRight className="w-5 h-5 inline-block ml-2" />
                </LocalizedClientLink>
              </motion.div>
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
