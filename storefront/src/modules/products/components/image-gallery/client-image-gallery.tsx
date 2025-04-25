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
  
  useEffect(() => {
    try {
      // Default to all images if no selection or no images
      if (!selectedColor || images.length === 0) {
        setFilteredImages(images)
        return
      }
      
      console.log("Filtering images with selectedColor:", selectedColor)
      
      // Filter images based on the selected option value
      const filtered = images.filter((img) => {
        const lowerUrl = img.url.toLowerCase()
        const lowerValue = selectedColor.toLowerCase()
        
        // Check for "Con Base" or "Sin Base"
        if (lowerValue === "con base") {
          return lowerUrl.includes("con")
        } else if (lowerValue === "sin base") {
          return lowerUrl.includes("sin")
        } else {
          // For colors or other options
          return lowerUrl.includes(lowerValue.replace(" ", "").toLowerCase())
        }
      })
      
      console.log("Filtered images count:", filtered.length)
      
      // Always show something
      if (filtered.length === 0) {
        setFilteredImages(images)
      } else {
        setFilteredImages(filtered)
      }
    } catch (error) {
      console.error("Error filtering images:", error)
      setFilteredImages(images) // Fallback to all images
    }
  }, [selectedColor, images])
  
  // Make sure we always return the gallery even if things go wrong
  try {
    return <ImageGallery images={filteredImages.length > 0 ? filteredImages : images} />
  } catch (error) {
    console.error("Error rendering ImageGallery:", error)
    return <div>Unable to display product images</div>
  }
}