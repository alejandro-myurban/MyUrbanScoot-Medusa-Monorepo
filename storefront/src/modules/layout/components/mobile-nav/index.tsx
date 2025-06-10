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
import { motion, AnimatePresence } from "framer-motion"
import SearchModal from "@modules/search-algolia/components/modal"
import LanguageSwitcher from "../language-switcher"
import { useTranslation } from "react-i18next"

interface MobileMenuProps {
  categories: any[]
  isDark: boolean
}

// Variantes de animación optimizadas
const collapsibleVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    overflow: "visible",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: {
      duration: 0.15,
      ease: "easeInOut",
    },
  },
}

const itemVariants = {
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
      ease: "easeOut",
    },
  },
}

const linkVariants = {
  hidden: {
    opacity: 0,
    y: 5,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
}

export default function MobileMenu({ categories, isDark }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [openBrands, setOpenBrands] = useState<string[]>([])
  const {t} = useTranslation()

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
        className={`w-full sm:w-3/4 md:2/4 lg:1/4 ${bgColor} backdrop-blur-md ${borderColor} border-r flex flex-col`}
      >
        {/* Header fijo */}
        <SheetHeader className="text-left flex justify-between space-y-0 flex-row items-center flex-shrink-0">
          <SheetTitle className={`${textColor} text-xl font-bold`}>
            Menú
          </SheetTitle>
          <motion.button
            onClick={() => setIsOpen(false)}
            className={`${textColor} hover:${hoverColor} m-0 transition-all duration-200`}
            aria-label="Cerrar menú"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-10 h-10" />
          </motion.button>
        </SheetHeader>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden mt-8 pr-2 pb-6">
          <div className="space-y-6">
            {/* Logo con animación */}
            <motion.div
              className="pb-6 border-b border-gray-200/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <img
                className="transition-all object-cover duration-200 hover:scale-105"
                src="/logomys.png"
                alt="MyUrbanScoot Logo"
              />
            </motion.div>

            {/* Navigation Links */}
            <nav className="space-y-4">
              {/* Links de cuenta con animación */}
              <motion.div
                className="flex gap-2 justify-center items-center"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                <motion.div
                  className="relative z-[10000]"
                  variants={linkVariants}
                >
                  <SearchModal dark={isDark} />
                </motion.div>
                <motion.div className="flex items-center justify-center gap-2" variants={linkVariants}>
                  <LanguageSwitcher /> <p className="text-white/90 font-semibold">{t("navigation.lang")}</p>
                </motion.div>
              </motion.div>

              {/* Divider */}
              <div className="border-t border-gray-200/20 pt-6"></div>

              {/* Blog con animación */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <LocalizedClientLink
                  href="/category/noticias-patinete-electrico"
                  onClick={handleLinkClick}
                  className={`${textColorSecondary} ${hoverColor} block py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                >
                  <span className="text-lg font-medium">Blog</span>
                </LocalizedClientLink>
              </motion.div>

              {/* Vinilos - Collapsible con animación */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
                <motion.button
                  className={`${textColorSecondary} ${hoverColor} flex items-center justify-between w-full py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  whileTap={{ scale: 0.98 }}
                >
                  <LocalizedClientLink
                    href="/categories/vinilos"
                    className="text-lg font-medium"
                  >
                    {vinylsCategory?.name || "Vinilos"}
                  </LocalizedClientLink>
                  <motion.div
                    animate={{ rotate: isCategoriesOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </motion.button>

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
                              <div className="flex items-center">
                                <LocalizedClientLink
                                  href={`/categories/${brand.handle}`}
                                  onClick={handleLinkClick}
                                  className={`${textColorSecondary} ${hoverColor} flex-1 py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-100/5 text-base font-medium`}
                                >
                                  {brand.name}
                                </LocalizedClientLink>
                                <motion.button
                                  className={`${textColorSecondary} ${hoverColor} flex justify-end p-2`}
                                  onClick={() => toggleBrand(brand.id)}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <motion.div
                                    animate={{
                                      rotate: openBrands.includes(brand.id)
                                        ? 180
                                        : 0,
                                    }}
                                    transition={{
                                      duration: 0.2,
                                      ease: "easeInOut",
                                    }}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </motion.div>
                                </motion.button>
                              </div>

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
              >
                <LocalizedClientLink
                  href="/spare-parts"
                  onClick={handleLinkClick}
                  className={`${textColorSecondary} ${hoverColor} block py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-100/10`}
                >
                  <span className="text-lg font-medium">Recambios</span>
                </LocalizedClientLink>
              </motion.div>
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
