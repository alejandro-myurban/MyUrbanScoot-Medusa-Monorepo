// src/modules/product-reviews/components/ProductReviewModal.tsx
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { X, Upload, Trash2 } from "lucide-react"
import { toast } from "@medusajs/ui"

interface Props {
  product: HttpTypes.StoreProduct
  isOpen: boolean
  onClose: () => void
}

export default function ProductReviewModal({
  product,
  isOpen,
  onClose,
}: Props) {
  const router = useRouter()

  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [images, setImages] = useState<File[]>([]) // Nuevo estado para las imágenes
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para manejar la selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validaciones
    const validFiles = files.filter(file => {
      // Solo imágenes
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`)
        return false
      }
      
      // Máximo 5MB por imagen
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande (máximo 5MB)`)
        return false
      }
      
      return true
    })

    // Máximo 3 imágenes total
    const totalImages = images.length + validFiles.length
    if (totalImages > 3) {
      toast.error("Máximo 3 imágenes permitidas")
      const allowedFiles = validFiles.slice(0, 3 - images.length)
      setImages(prev => [...prev, ...allowedFiles])
    } else {
      setImages(prev => [...prev, ...validFiles])
    }

    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    e.target.value = ''
  }

  // Función para eliminar una imagen
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Función para subir imágenes usando el workflow de Medusa
  const uploadImages = async (files: File[]): Promise<string[]> => {
    try {
      const formData = new FormData()
      
      // Añadir todas las imágenes con el nombre 'files'
      files.forEach((file, index) => {
        console.log(`📎 Añadiendo archivo ${index}:`, {
          name: file.name,
          type: file.type,
          size: file.size
        })
        formData.append('files', file)
      })
      
      // Debug FormData
      console.log("📤 FormData entries:")
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`  ${key}:`, value)
      })
      
      console.log("📤 Subiendo", files.length, "imágenes...")
      
      // Usar fetch directo sin el SDK para asegurar que se envía como multipart/form-data
      const response = await fetch(`http://localhost:9000/store/upload-image`, {
        headers: {
          "x-publishable-api-key" : "pk_14db1a49297371bf3f8d345db0cf016616d4244f1d593db1050907c88333cd21"
        },
        method: "POST",
        body: formData,
        // NO incluir Content-Type header, el browser lo establece automáticamente
        // con el boundary correcto para multipart/form-data
      })
      
      console.log("📥 Response status:", response.status)
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log("📥 Respuesta del upload:", result)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || result.details || 'Error desconocido'}`)
      }
      
      if (result.success && result.files) {
        // Extraer las URLs de los archivos subidos
        return result.files.map((file: any) => file.url)
      }
      
      if (result.url) {
        // Fallback para compatibilidad con respuesta de una sola imagen
        return [result.url]
      }
      
      throw new Error("No se recibieron URLs de las imágenes")
      
    } catch (error) {
      console.error('Error uploading images:', error)
      const errorMessage = (error instanceof Error && error.message) ? error.message : String(error)
      toast.error("Error subiendo imágenes: " + errorMessage)
      return [] // Retornar array vacío si falla
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      console.log("🔥 MODAL: Enviando a /store/anon-reviews")
      
      // Subir imágenes primero si hay alguna
      let imageUrls: string[] = []
      if (images.length > 0) {
        imageUrls = await uploadImages(images)
      }

      // Usar nuestro endpoint personalizado
      const response = await sdk.client.fetch("/store/anon-reviews", {
        method: "POST",
        body: {
          product_id: product.id,
          rating,
          content: comment,
          name: name.trim() || undefined,
          images: imageUrls, // Enviar las URLs de las imágenes
        },
      })

      console.log("Review created:", response)

      // Limpiar formulario y cerrar modal
      toast.success("Reseña creada con éxito")
      setComment("")
      setName("")
      setRating(5)
      setImages([]) // Limpiar imágenes
      onClose()

      // Refrescar para mostrar la nueva reseña
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error enviando la reseña")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Reseña: {product.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de nombre */}
          <label className="block">
            <span className="font-medium">Tu nombre</span>
            <input
              type="text"
              className="mt-1 block w-full rounded border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre (opcional)"
              maxLength={50}
            />
          </label>

          {/* Rating con estrellas visuales */}
          <label className="block">
            <span className="font-medium">Puntuación</span>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating} de 5 estrellas
              </span>
            </div>
          </label>

          {/* Comentario */}
          <label className="block">
            <span className="font-medium">Tu opinión</span>
            <textarea
              className="mt-1 block w-full rounded border px-3 py-2 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Cuéntanos qué te pareció este producto..."
              required
            />
          </label>

          {/* Upload de imágenes */}
          <div className="block">
            <span className="font-medium">Imágenes (opcional)</span>
            <p className="text-sm text-gray-500 mb-2">
              Máximo 3 imágenes, 5MB cada una
            </p>
            
            {/* Input de archivo oculto */}
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={images.length >= 3}
            />
            
            {/* Botón de upload personalizado */}
            <label
              htmlFor="image-upload"
              className={`inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${
                images.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload size={16} />
              {images.length >= 3 ? 'Máximo alcanzado' : 'Subir imágenes'}
            </label>

            {/* Preview de imágenes seleccionadas */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {submitting ? "Enviando…" : "Enviar reseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}