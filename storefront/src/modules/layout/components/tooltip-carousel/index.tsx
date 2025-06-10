"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export default function PromoCarousel() {
  const [index, setIndex] = useState(0)
  const { t } = useTranslation()

  const messageKeys = ["navigation.tooltip.shippment", "navigation.tooltip.gift", "navigation.tooltip.spare_parts"]

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messageKeys.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [messageKeys.length])

  return (
    <div className="w-full bg-black text-white text-center text-sm font-medium py-3 overflow-hidden relative h-[40px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={messageKeys[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {t(messageKeys[index])}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
