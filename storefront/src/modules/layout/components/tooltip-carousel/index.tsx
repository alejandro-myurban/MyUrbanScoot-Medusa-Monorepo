"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const messages = [
  "🚚 Envíos gratis con 20 €",
  "🎁 Regalo en pedidos superiores a 100 €",
  "🛠️ Repuestos exclusivos para tu patinete",
]

export default function PromoCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full bg-black text-white text-center text-sm font-medium py-3 overflow-hidden relative h-[40px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={messages[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {messages[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
