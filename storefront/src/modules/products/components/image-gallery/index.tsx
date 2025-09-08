import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useState, useEffect } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Resetear índice cuando cambien las imágenes
  useEffect(() => {
    console.log("🖼️ ImageGallery - Images changed:", images.length)
    console.log("🔄 Resetting carousel to index 0")
    setCurrentImageIndex(0)
  }, [images])

  if (!images || images.length === 0) {
    console.log("❌ No images available")
    return <div>No hay imágenes disponibles</div>
  }

  const currentImage = images[currentImageIndex]

  console.log("📸 Current image index:", currentImageIndex, "of", images.length)
  console.log("🎛️ Should show controls?", images.length > 1 && isClient)
  console.log("📱 Is client?", isClient)
  console.log("🔘 Should show indicators?", isClient && images.length > 1)

  const goToNext = () => {
    const newIndex = (currentImageIndex + 1) % images.length
    console.log("➡️ Going to next:", newIndex)
    setCurrentImageIndex(newIndex)
  }

  const goToPrevious = () => {
    const newIndex = (currentImageIndex - 1 + images.length) % images.length
    console.log("⬅️ Going to previous:", newIndex)
    setCurrentImageIndex(newIndex)
  }

  const goToSlide = (index: number) => {
    console.log("🎯 Going to slide:", index)
    setCurrentImageIndex(index)
  }

  // Funciones para manejar touch/swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // Si no hay touchEnd, no es un swipe
    setTouchStart(e.targetTouches[0].clientX)
    console.log("👆 Touch start:", e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    console.log("🤚 Touch end - Distance:", distance)
    console.log("⬅️ Left swipe:", isLeftSwipe)
    console.log("➡️ Right swipe:", isRightSwipe)

    if (isLeftSwipe && images.length > 1) {
      console.log("👆 Swiped left - going to next")
      goToNext()
    } else if (isRightSwipe && images.length > 1) {
      console.log("👆 Swiped right - going to previous")
      goToPrevious()
    }
  }

  return (
    <div className="flex items-start sm:pt-20 relative">
      <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
        {/* Imagen principal */}
        <div className="relative group">
          <Container
            className="relative rounded-none shadow-none border-none aspect-[29/34] w-full overflow-hidden cursor-pointer"
            id={currentImage.id}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {!!currentImage.url && (
              <Image
                src={currentImage.url}
                priority={true}
                className="absolute inset-0 p-4 sm:p-0 transition-opacity duration-300"
                alt={`Imagen del producto ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                style={{
                  objectFit: "cover",
                }}
              />
            )}

            {/* Controles de navegación - solo desktop */}
            {isClient && images.length > 1 && (
              <>
                {/* Botón anterior - solo desktop */}
                <button
                  onClick={goToPrevious}
                  className="hidden lg:block absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  aria-label="Imagen anterior"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Botón siguiente - solo desktop */}
                <button
                  onClick={goToNext}
                  className="hidden lg:block absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  aria-label="Imagen siguiente"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Contador de imágenes */}
                {isClient && (
                  <div className="absolute top-3 right-4 bg-gray-500 font-archivoBlack text-white font-bold px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </>
            )}
          </Container>

          {/* INDICADORES FULL WIDTH  */}
          <div className="w-full flex mt-2">
            {isClient && images.length > 1 ? (
              // Múltiples imágenes - cada indicador ocupa su proporción
              images.map((_, index) => {
                const isActive = index === currentImageIndex
                console.log(
                  `🔘 Indicator ${index}: ${isActive ? "active" : "inactive"}`
                )

                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 flex-1 transition-all duration-200 ${
                      isActive ? "bg-gray-500" : "bg-white hover:bg-gray-600"
                    }`}
                    aria-label={`Ir a la imagen ${index + 1}`}
                  />
                )
              })
            ) : (
              // Una sola imagen - línea decorativa blanca
              <div className="w-full h-2 bg-white"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageGallery
