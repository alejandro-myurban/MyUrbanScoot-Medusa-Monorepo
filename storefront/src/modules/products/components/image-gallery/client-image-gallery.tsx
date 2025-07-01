"use client"

import ImageGallery from "@modules/products/components/image-gallery"
import { HttpTypes } from "@medusajs/types"
import { useColorContext } from "@lib/context/color-content-provider"
import { useEffect, useState } from "react"

type ClientImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

export default function ClientImageGallery({ images }: ClientImageGalleryProps) {
  const { selectedColor } = useColorContext()
  const [filteredImages, setFilteredImages] = useState(images)
  const [isClient, setIsClient] = useState(false)
  
  // Evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  useEffect(() => {
    // Solo ejecutar después de que el componente esté montado en el cliente
    if (!isClient) return
    
    try {
      console.log("🔍 ClientImageGallery - Processing images...")
      console.log("📋 Total images:", images.length)
      console.log("🎨 Selected color:", selectedColor)
      
      // Si no hay selección, mostrar todas las imágenes desde la primera
      if (!selectedColor || images.length === 0) {
        console.log("✅ No filter - showing all images from index 0")
        setFilteredImages(images)
        return
      }
      
      console.log("🔄 Finding preferred starting image for:", selectedColor)
      
      // Encontrar el índice de la imagen que mejor coincida con la selección
      let preferredIndex = 0
      
      const matchingIndex = images.findIndex((img) => {
        const lowerUrl = img.url.toLowerCase()
        const lowerValue = selectedColor.toLowerCase()
        
        console.log(`🖼️  Checking image: ${img.url}`)
        
        let matches = false
        
        // Check for "Con Base" or "Sin Base"
        if (lowerValue === "con base") {
          matches = lowerUrl.includes("con")
          console.log(`   ➡️ Checking for "con": ${matches}`)
        } else if (lowerValue === "sin base") {
          matches = lowerUrl.includes("sin")
          console.log(`   ➡️ Checking for "sin": ${matches}`)
        } else {
          // For colors or other options
          const cleanValue = lowerValue.replace(" ", "").toLowerCase()
          matches = lowerUrl.includes(cleanValue)
          console.log(`   ➡️ Checking for "${cleanValue}": ${matches}`)
        }
        
        return matches
      })
      
      if (matchingIndex !== -1) {
        preferredIndex = matchingIndex
        console.log("🎯 Found matching image at index:", preferredIndex)
      } else {
        console.log("⚠️ No exact match found, starting from index 0")
      }
      
      // Reordenar las imágenes para que la preferida aparezca primero
      const reorderedImages = [
        ...images.slice(preferredIndex),  // Desde la imagen preferida hasta el final
        ...images.slice(0, preferredIndex) // Desde el inicio hasta la imagen preferida
      ]
      
      console.log("📊 Reordered images - preferred image now at index 0")
      console.log("🎬 Total images to show:", reorderedImages.length)
      
      setFilteredImages(reorderedImages)
      
    } catch (error) {
      console.error("❌ Error processing images:", error)
      setFilteredImages(images) // Fallback to all images
    }
  }, [selectedColor, images, isClient])

  // Make sure we always return the gallery even if things go wrong
  try {
    // Mostrar loading durante la hidratación para evitar flash
    if (!isClient) {
      console.log("⏳ Waiting for client hydration...")
      return (
        <div className="flex items-start relative">
          <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
            <div className="relative">
              <div className="relative rounded-none shadow-none border-none aspect-[29/34] w-full overflow-hidden bg-gray-100 animate-pulse">
                {/* Skeleton loader */}
              </div>
              <div className="w-2/5 h-2 bg-gray-300 mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      )
    }
    
    const imagesToRender = filteredImages.length > 0 ? filteredImages : images
    console.log("🎬 Rendering ImageGallery with", imagesToRender.length, "images")
    
    return <ImageGallery images={imagesToRender} />
  } catch (error) {
    console.error("❌ Error rendering ImageGallery:", error)
    return <div>Unable to display product images</div>
  }
}