"use client"

import { useState, useRef } from "react"
import { phoneSchema } from "../utils/validation"
import { VALIDATION_TIMEOUTS, API_ENDPOINTS } from "../utils/constants"
import type { 
  PhoneValidationState, 
  FinancingFormData,
  UsePhoneValidationReturn 
} from "../types"

export const usePhoneValidation = (
  formData: FinancingFormData,
  setFormData: (data: FinancingFormData | ((prev: FinancingFormData) => FinancingFormData)) => void,
  validateFieldImmediate: (fieldName: string, value: string) => void
): UsePhoneValidationReturn => {
  const phoneTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const zodValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationState>({
    isChecking: false,
    exists: null,
    message: ""
  })

  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null)

  // Función para validar formato Zod (extraída del original)
  const validatePhoneWithZod = (phoneNumber: string) => {
    console.log("🔍 Validando teléfono con Zod:", phoneNumber)
    
    // Solo validar si tiene al menos 3 caracteres para evitar validación inmediata
    if (!phoneNumber || phoneNumber.trim().length < 3) {
      setPhoneValidationError(null)
      return
    }

    const zodValidation = phoneSchema.safeParse(phoneNumber)
    if (!zodValidation.success) {
      const firstError = zodValidation.error.errors[0]?.message
      console.log("❌ Error de Zod:", firstError)
      setPhoneValidationError(firstError)
    } else {
      console.log("✅ Validación Zod exitosa")
      setPhoneValidationError(null)
    }
  }

  // Función para validar teléfono duplicado (extraída del original)
  const checkPhoneExists = async (phoneNumber: string) => {
    console.log("🔍 checkPhoneExists llamado con:", phoneNumber)
    
    if (!phoneNumber || phoneNumber.trim().length < 9) {
      console.log("❌ Teléfono demasiado corto o vacío:", phoneNumber)
      setPhoneValidation({ isChecking: false, exists: null, message: "" })
      return
    }

    console.log("🔄 Iniciando validación de teléfono:", phoneNumber.trim())
    setPhoneValidation({ isChecking: true, exists: null, message: "Verificando..." })

    try {
      console.log("📡 Enviando request a", API_ENDPOINTS.CHECK_PHONE)
      const response = await fetch(API_ENDPOINTS.CHECK_PHONE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber.trim()
        })
      })

      console.log("📨 Response status:", response.status)
      const result = await response.json()
      console.log("📊 Response data:", result)
      console.log("📊 result.exists:", result.exists)
      console.log("📊 result.exists type:", typeof result.exists)
      console.log("📊 result.message:", result.message)
      console.log("📊 result.normalized_phone:", result.normalized_phone)

      const newValidationState = {
        isChecking: false,
        exists: result.exists,
        message: result.message
      }
      
      console.log("📊 Actualizando phoneValidation a:", newValidationState)
      setPhoneValidation(newValidationState)

      // Si el backend devolvió un teléfono normalizado, actualizar el campo
      if (result.normalized_phone && result.normalized_phone !== phoneNumber) {
        console.log(`📞 Actualizando teléfono con versión normalizada: "${phoneNumber}" -> "${result.normalized_phone}"`)
        setFormData((prev) => {
          console.log("📞 Actualizando formData, prev:", prev.phone_mumber, "new:", result.normalized_phone)
          const newData = { ...prev, phone_mumber: result.normalized_phone }
          console.log("📞 Nuevo formData:", newData.phone_mumber)
          return newData
        })
      } else {
        console.log(`📞 No se actualiza teléfono. normalized_phone: "${result.normalized_phone}", phoneNumber: "${phoneNumber}"`)
      }

      if (result.exists) {
        console.log("❌ Teléfono YA EXISTE en la base de datos")
      } else {
        console.log("✅ Teléfono DISPONIBLE")
      }

    } catch (error) {
      console.error("❌ Error validando teléfono:", error)
      setPhoneValidation({
        isChecking: false,
        exists: null,
        message: "Error al validar teléfono"
      })
    }
  }

  // Manejo del onBlur para el teléfono (extraído del original)
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log("🔍 onBlur detectado para teléfono:", value)
    
    // Validar inmediatamente cuando se quita el foco
    if (value && value.trim().length >= 3) {
      // Limpiar timeouts pendientes ya que validamos inmediatamente
      if (zodValidationTimeoutRef.current) {
        clearTimeout(zodValidationTimeoutRef.current)
        zodValidationTimeoutRef.current = null
      }
      
      if (phoneTimeoutRef.current) {
        clearTimeout(phoneTimeoutRef.current)
        phoneTimeoutRef.current = null
      }
      
      // Validar formato inmediatamente
      console.log("📞 Validando formato por onBlur")
      validatePhoneWithZod(value)
      
      // Si el formato es válido, validar duplicados también
      const zodValidation = phoneSchema.safeParse(value)
      if (zodValidation.success && value.trim().length >= 9) {
        console.log("📞 Validando duplicados por onBlur")
        setTimeout(() => checkPhoneExists(value), 100) // Pequeño delay para que se vea el loading
      }
    }
  }

  // Manejo del onBlur para otros campos (extraído del original)
  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    console.log(`🔍 onBlur detectado para ${name}:`, value)
    
    // Validar inmediatamente cuando se quita el foco
    if (name !== "phone_mumber") {
      validateFieldImmediate(name, value)
    }
  }

  // Función para manejar cambios en el teléfono (parte específica del teléfono extraída del handleInputChange original)
  const handlePhoneInputChange = (value: string) => {
    console.log("📞 Campo teléfono detectado, valor:", value)
    
    // Limpiar validaciones anteriores
    setPhoneValidation({ isChecking: false, exists: null, message: "" })
    
    // Limpiar timeouts anteriores si existen
    if (phoneTimeoutRef.current) {
      console.log("⏰ Limpiando timeout de duplicados anterior")
      clearTimeout(phoneTimeoutRef.current)
      phoneTimeoutRef.current = null
    }
    
    if (zodValidationTimeoutRef.current) {
      console.log("⏰ Limpiando timeout de Zod anterior")
      clearTimeout(zodValidationTimeoutRef.current)
      zodValidationTimeoutRef.current = null
    }
    
    // Limpiar error de Zod anterior si el campo está vacío
    if (!value || value.trim().length < 3) {
      setPhoneValidationError(null)
    }
    
    // Configurar timeout para validación de Zod (1.5 segundos)
    console.log("⏰ Configurando timeout para validación Zod en 1.5 segundos")
    zodValidationTimeoutRef.current = setTimeout(() => {
      console.log("⏰ Timeout Zod ejecutado para:", value)
      validatePhoneWithZod(value)
      zodValidationTimeoutRef.current = null
    }, VALIDATION_TIMEOUTS.PHONE_ZOD)
    
    // Solo configurar timeout para duplicados si parece un teléfono válido
    if (value && value.trim().length >= 9) {
      console.log("⏰ Configurando timeout para validación de duplicados en 2 segundos")
      phoneTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Timeout duplicados ejecutado para:", value)
        // Primero validar con Zod antes de validar duplicados
        const zodValidation = phoneSchema.safeParse(value)
        if (zodValidation.success) {
          checkPhoneExists(value)
        } else {
          console.log("❌ No se valida duplicados porque Zod falló")
        }
        phoneTimeoutRef.current = null
      }, VALIDATION_TIMEOUTS.PHONE_DUPLICATES)
    }
  }

  return {
    phoneValidation,
    phoneValidationError,
    validatePhoneWithZod,
    checkPhoneExists,
    handlePhoneBlur,
    handleFieldBlur,
    handlePhoneInputChange
  }
}