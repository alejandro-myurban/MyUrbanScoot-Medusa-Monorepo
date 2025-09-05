"use client"

import { useState, useRef } from "react"
import { validateField } from "../utils/validation"
import { FRIENDLY_FIELD_MESSAGES } from "../utils/constants"
import type { 
  FinancingFormData, 
  FileStates, 
  UseFormValidationReturn 
} from "../types"

export const useFormValidation = (
  formData: FinancingFormData,
  files: FileStates,
  isUnemployed: boolean
): UseFormValidationReturn => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const fieldValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Helper para asegurar que los errores sean strings válidos (extraído del original)
  const getFieldError = (fieldName: string): string | null => {
    const error = fieldErrors[fieldName]
    if (!error) return null
    
    // Si es un objeto, convertir a string amigable
    if (typeof error === 'object') {
      return FRIENDLY_FIELD_MESSAGES[fieldName] || "Por favor, revisa este campo"
    }
    
    // Si es una string válida, devolverla
    if (typeof error === 'string' && error.trim().length > 0) {
      return error
    }
    
    return null
  }

  // Función para validar un campo individual (extraída del original con algunas optimizaciones)
  const validateSingleField = (fieldName: string, value: string, currentFormData?: Partial<FinancingFormData>) => {
    // Usar datos actuales del formulario o datos pasados para validaciones condicionales
    const dataToValidate = currentFormData || formData
    
    const result = validateField(fieldName, value, dataToValidate)
    
    if (result.success) {
      // Si la validación fue exitosa, remover error
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    } else {
      // Si hay error, establecerlo
      if (result.error && result.error.trim().length > 0) {
        setFieldErrors(prev => ({
          ...prev,
          [fieldName]: result.error!
        }))
      } else {
        // Si no hay mensaje válido, usar mensaje por defecto
        setFieldErrors(prev => ({
          ...prev,
          [fieldName]: FRIENDLY_FIELD_MESSAGES[fieldName] || "Por favor, revisa este campo"
        }))
      }
    }
  }

  // Función para validar un campo con debounce (para ser usada desde componentes)
  const validateFieldWithDebounce = (fieldName: string, value: string, currentFormData?: Partial<FinancingFormData>) => {
    // Para otros campos, cancelar timeout anterior y configurar nuevo
    if (fieldValidationTimeoutRef.current) {
      clearTimeout(fieldValidationTimeoutRef.current)
      fieldValidationTimeoutRef.current = null
    }
    
    // Solo validar si el campo no está vacío o es un campo requerido
    if (value && value.trim().length > 0) {
      fieldValidationTimeoutRef.current = setTimeout(() => {
        validateSingleField(fieldName, value, currentFormData)
        fieldValidationTimeoutRef.current = null
      }, 1500)
    } else {
      // Si está vacío, limpiar errores inmediatamente
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Función para validar inmediatamente (onBlur)
  const validateFieldImmediate = (fieldName: string, value: string) => {
    validateSingleField(fieldName, value, formData)
  }

  // Función para obtener documentos faltantes (extraída del original)
  const getMissingDocuments = (): string[] => {
    const missing = []
    
    if (!files.identity_front_file_id) missing.push("DNI frontal")
    if (!files.identity_back_file_id) missing.push("DNI trasero")
    if (!formData.contract_type) missing.push("Tipo de contrato")
    
    if (formData.contract_type && !files.bank_account_proof_file) {
      missing.push("Justificante bancario")
    }

    switch (formData.contract_type) {
      case "employee_temporary":
      case "employee_permanent":
        if (!files.paysheet_file) missing.push("Al menos una nómina")
        break
      case "freelance":
        if (!files.freelance_rental_file) missing.push("Declaración de la renta")
        if (!files.freelance_quote_file) missing.push("Cuota de autónomos")
        break
      case "pensioner":
        if (!files.pensioner_proof_file) missing.push("Justificante de pensión")
        break
      case "unemployed":
        if (!files.pensioner_proof_file) missing.push("Justificante de desempleo")
        break
    }

    return missing
  }

  // Función para validar documentos requeridos (extraída del original)
  const validateRequiredDocuments = (): boolean => {
    return getMissingDocuments().length === 0
  }

  // Determinar si el formulario es válido (simplificado, sin phoneValidation que va en otro hook)
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const isFormValid = !isUnemployed && validateRequiredDocuments() && !hasFieldErrors

  return {
    fieldErrors,
    validateField: validateFieldWithDebounce,
    validateFieldImmediate,
    getFieldError,
    validateRequiredDocuments,
    getMissingDocuments,
    isFormValid
  }
}