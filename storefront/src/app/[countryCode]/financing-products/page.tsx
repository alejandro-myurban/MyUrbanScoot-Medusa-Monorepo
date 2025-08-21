"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { toast, Toaster } from "@medusajs/ui"
import { z } from "zod"
import { FormInput } from "@/modules/financing/components/form-input"
import {
  FileInputEnhanced,
  type FileStates,
} from "@/modules/financing/components/file-input"
import { FormSelect } from "@/modules/financing/components/select-input"
import { FormTextarea } from "@/modules/financing/components/textarea-input"
import { sdk } from "@/lib/config"
import WhatsApp from "@/modules/common/icons/whatsapp"

// Esquema de validación Zod para teléfono
const phoneSchema = z.string()
  .min(1, "El número de teléfono es requerido")
  .regex(/^[+]?[\d\s\-\(\)]+$/, "El número de teléfono solo puede contener dígitos, espacios, guiones y paréntesis")
  .refine((phone) => {
    // Limpiar el teléfono de espacios y caracteres especiales
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    
    // Si tiene prefijo internacional, validar longitud apropiada
    if (cleanPhone.startsWith('+')) {
      const withoutPlus = cleanPhone.substring(1)
      
      // +34 (España): 11-12 dígitos total (+34 + 9 dígitos)
      if (withoutPlus.startsWith('34')) {
        return cleanPhone.length >= 12 && cleanPhone.length <= 13
      }
      
      // +33 (Francia), +32 (Bélgica), etc.: 10-14 dígitos total
      if (withoutPlus.match(/^(33|32|31|49|44|39|41|43|351|352)/)) {
        return cleanPhone.length >= 10 && cleanPhone.length <= 14
      }
      
      // Otros prefijos internacionales: 8-15 dígitos total
      return cleanPhone.length >= 8 && cleanPhone.length <= 15
    }
    
    // Sin prefijo: debe ser 9 dígitos españoles o 10-11 dígitos con 34
    if (cleanPhone.length === 9) {
      // Números españoles sin prefijo: deben empezar con 6, 7, 8 o 9
      return /^[6789]/.test(cleanPhone)
    }
    
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      // Podría ser 34 + número español
      return cleanPhone.startsWith('34') && /^34[6789]/.test(cleanPhone)
    }
    
    return false
  }, {
    message: "Formato de teléfono inválido. Use: 600123456, +34600123456, o +33123456789"
  })
  .refine((phone) => {
    // Validación adicional: no permitir números obviamente falsos
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const digitsOnly = cleanPhone.replace(/^\+/, '')
    
    // No permitir todos los dígitos iguales
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return false
    }
    
    // No permitir secuencias obvias como 123456789
    if (digitsOnly.includes('123456789') || digitsOnly.includes('987654321')) {
      return false
    }
    
    return true
  }, {
    message: "Número de teléfono no válido (no puede ser secuencial o repetitivo)"
  })

// --- Tipos de datos ---
interface FinancingFormData {
  email: string
  identity: string
  income: string
  paysheet_file_id: string | null
  contract_type: string
  company_position: string
  company_start_date: string
  freelance_rental_file_id: string | null
  freelance_quote_file_id: string | null
  freelance_start_date: string  // Nueva fecha de alta de autónomos
  pensioner_proof_file_id: string | null
  bank_account_proof_file_id: string | null
  financing_installment_count: string
  housing_type: string
  housing_type_details: string
  civil_status: string
  marital_status_details: string
  address: string
  postal_code: string
  city: string
  province: string
  phone_mumber: string
  doubts: string
}

export default function FinancingPage() {
  const router = useRouter()
  const phoneTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const zodValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState<FinancingFormData>({
    email: "",
    identity: "",
    income: "",
    paysheet_file_id: null,
    contract_type: "",
    company_position: "",
    company_start_date: "",
    freelance_rental_file_id: null,
    freelance_quote_file_id: null,
    freelance_start_date: "",  // Nueva fecha de alta de autónomos
    pensioner_proof_file_id: null,
    bank_account_proof_file_id: null,
    financing_installment_count: "12",
    housing_type: "rent",
    housing_type_details: "",
    civil_status: "single",
    marital_status_details: "",
    address: "",
    postal_code: "",
    city: "",
    province: "",
    phone_mumber: "",
    doubts: "",
  })

  const [files, setFiles] = useState<FileStates>({
    identity_front_file_id: null,
    identity_back_file_id: null,
    paysheet_file: null,
    paysheet_file_2: null,
    freelance_rental_file: null,
    freelance_quote_file: null,
    pensioner_proof_file: null,
    bank_account_proof_file: null,
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneValidation, setPhoneValidation] = useState<{
    isChecking: boolean
    exists: boolean | null
    message: string
  }>({
    isChecking: false,
    exists: null,
    message: ""
  })

  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null)
  
  // console.log("🔍 Estado actual phoneValidation:", phoneValidation)
  const [documentVerifications, setDocumentVerifications] = useState<{
    front?: any
    back?: any
    payroll?: any
    payroll_2?: any
    bank?: any
  }>({})

  const handleVerificationComplete = (
    type: "front" | "back" | "payroll" | "payroll_2" | "bank",
    result: any
  ) => {
    console.log(`Verificación ${type} completada:`, result)
    setDocumentVerifications((prev) => ({
      ...prev,
      [type]: result,
    }))
  }

  // --- Función para validar formato Zod ---
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

  // --- Función para validar teléfono ---
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
      console.log("📡 Enviando request a /api/store/financing-data/check-phone")
      const response = await fetch("/api/store/financing-data/check-phone", {
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

  // --- Manejadores de eventos ---
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Si es el campo del teléfono, validar después de un delay
    if (name === "phone_mumber") {
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
      }, 1500)
      
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
        }, 2000)
      }
    }
  }

  // --- Manejo del onBlur para el teléfono ---
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target
    if (inputFiles && inputFiles.length > 0) {
      const file = inputFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} es demasiado grande (máx 10MB).`)
        return
      }
      setFiles((prev) => ({ ...prev, [name]: file }))
    }
  }

  const removeFile = (fileName: keyof FileStates) => {
    setFiles((prev) => ({ ...prev, [fileName]: null }))
    setFormData((prev) => ({ ...prev, [`${fileName}_id`]: null }))
  }

  // --- Lógica de subida y envío ---
  const uploadFile = async (file: File): Promise<string> => {
    const uploadToast = toast.loading(`Subiendo ${file.name}...`)
    try {
      const formData = new FormData()
      formData.append("files", file)

      // Cambia la URL para usar tu API route
      const response = await fetch(`/api/upload-file`, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Error en la subida del archivo.")
      }

      const fileUrl = result.files?.[0]?.url
      if (!fileUrl) {
        throw new Error(
          "La respuesta del servidor no contenía la URL del archivo."
        )
      }

      toast.success(`${file.name} subido con éxito.`, { id: uploadToast })
      return fileUrl
    } catch (err: any) {
      console.error("Error al subir el archivo:", err)
      toast.error(`Error al subir ${file.name}: ${err.message}`, {
        id: uploadToast,
      })
      throw err
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ PRIMERA VALIDACIÓN: Verificar que todos los documentos requeridos estén presentes
    if (!isFormValid) {
      const missing = getMissingDocuments()
      const missingText = missing.length > 1 
        ? `${missing.slice(0, -1).join(", ")} y ${missing.slice(-1)}`
        : missing[0]
      toast.error(`Faltan documentos requeridos: ${missingText}`)
      return
    }

    // ✅ VALIDACIÓN ZOD DE TELÉFONO: Verificar formato
    const phoneZodValidation = phoneSchema.safeParse(formData.phone_mumber)
    if (!phoneZodValidation.success) {
      const firstError = phoneZodValidation.error.errors[0]?.message
      toast.error(`Error en el teléfono: ${firstError}`)
      return
    }

    // ✅ VALIDACIÓN DE TELÉFONO: Verificar que el teléfono no esté duplicado
    if (phoneValidation.exists) {
      toast.error("Ya existe una solicitud con este número de teléfono. Por favor, usa un número diferente.")
      return
    }

    // Si aún está validando el teléfono, esperar un momento
    if (phoneValidation.isChecking) {
      toast.error("Espera un momento mientras verificamos el número de teléfono...")
      return
    }

    // ✅ NUEVA VALIDACIÓN: Permitir envío si hay archivos, aunque falle el análisis
    let hasDocumentIssues = false
    let warningMessages = []

    // Verificar DNI frontal: solo bloquear si NO hay archivo
    if (!files.identity_front_file_id) {
      toast.error("Debes subir el DNI frontal para continuar.")
      setSubmitting(false)
      return
    }
    
    // Si hay archivo pero el análisis falló, solo advertir
    if (documentVerifications.front && !documentVerifications.front.isValid) {
      hasDocumentIssues = true
      warningMessages.push("DNI frontal")
    }

    // Verificar DNI trasero: solo bloquear si NO hay archivo
    if (!files.identity_back_file_id) {
      toast.error("Debes subir el DNI trasero para continuar.")
      setSubmitting(false)
      return
    }
    
    // Si hay archivo pero el análisis falló, solo advertir
    if (documentVerifications.back && !documentVerifications.back.isValid) {
      hasDocumentIssues = true
      warningMessages.push("DNI trasero")
    }

    // Si hay documentos con baja confianza, añadir a warnings
    if (documentVerifications.front && documentVerifications.front.confidence < 70) {
      hasDocumentIssues = true
      if (!warningMessages.includes("DNI frontal")) {
        warningMessages.push("DNI frontal (baja calidad)")
      }
    }

    if (documentVerifications.back && documentVerifications.back.confidence < 70) {
      hasDocumentIssues = true
      if (!warningMessages.includes("DNI trasero")) {
        warningMessages.push("DNI trasero (baja calidad)")
      }
    }

    // Si hay issues, mostrar advertencia pero permitir continuar
    if (hasDocumentIssues && warningMessages.length > 0) {
      const documentsText = warningMessages.length > 1 
        ? `${warningMessages.slice(0, -1).join(", ")} y ${warningMessages.slice(-1)}`
        : warningMessages[0]
      
      const proceed = confirm(
        `⚠️ Los documentos (${documentsText}) tienen problemas de análisis automático.\n\n` +
        `✅ Se puede enviar la solicitud igualmente, aunque podrías ser contactado posteriormente para verificar los datos manualmente.\n\n` +
        `¿Deseas continuar con el envío?`
      )
      
      if (!proceed) {
        setSubmitting(false)
        return
      }
      
      // Mostrar toast informativo
      toast.warning(
        `Solicitud enviada con documentos pendientes de verificación manual: ${documentsText}`,
        { duration: 5000 }
      )
    }

    setSubmitting(true)
    setError(null)
    setSubmitted(false)
    const toastId = toast.loading("Enviando solicitud...")

    try {
      const uploadedFileIds: Partial<Record<string, string>> = {}

      const fileMapping: Record<string, string> = {
        identity_front_file_id: "identity_front_file_id",
        identity_back_file_id: "identity_back_file_id",
        freelance_rental_file: "freelance_rental_file_id",
        freelance_quote_file: "freelance_quote_file_id",
        pensioner_proof_file: "pensioner_proof_file_id",
        bank_account_proof_file: "bank_account_proof_file_id",
      }

      // Subir archivos normales
      for (const [fileKey, targetField] of Object.entries(fileMapping)) {
        const file = files[fileKey as keyof FileStates]
        if (file) {
          const fileUrl = await uploadFile(file)
          uploadedFileIds[targetField] = fileUrl
        }
      }

      // Manejar nóminas especialmente (concatenar URLs si hay dos)
      const payrollUrls: string[] = []
      if (files.paysheet_file) {
        const url1 = await uploadFile(files.paysheet_file)
        payrollUrls.push(url1)
      }
      if (files.paysheet_file_2) {
        const url2 = await uploadFile(files.paysheet_file_2)
        payrollUrls.push(url2)
      }

      if (payrollUrls.length > 0) {
        uploadedFileIds["paysheet_file_id"] = payrollUrls.join("|")
      }

      // Combinar verificaciones de nóminas si hay dos
      let combinedPayrollVerification = null
      if (documentVerifications.payroll || documentVerifications.payroll_2) {
        combinedPayrollVerification = {
          primary: documentVerifications.payroll || null,
          secondary: documentVerifications.payroll_2 || null,
          combined: true,
        }
      }

      const finalPayload = {
        ...formData,
        ...uploadedFileIds,
        dni_front_verification: documentVerifications.front || null,
        dni_back_verification: documentVerifications.back || null,
        payroll_verification: combinedPayrollVerification,
        bank_verification: documentVerifications.bank || null,
        requested_at: new Date().toISOString(),
      }

      const response = await sdk.client.fetch("/store/financing-data", {
        method: "POST",
        body: finalPayload,
      })

      setSubmitted(true) // ✅ Marcar como enviado exitosamente
      toast.success("¡Solicitud de financiación enviada con éxito!", {
        id: toastId,
      })

      // ✅ Redirigir después de 2 segundos para mostrar el estado de éxito
      setTimeout(() => {
        router.push("/es/financing-success")
      }, 2000)
    } catch (err: any) {
      console.error("❌ Error en el envío:", err)
      setError(err.message)
      toast.error(`Error: ${err.message}`, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Componente de input mejorado ---

  // --- Componente de select mejorado ---

  // --- Componente de textarea mejorado ---

  // --- Componente de input de archivo mejorado ---

  // --- Lógica para determinar qué preguntas mostrar ---
  const getVisibleQuestions = () => {
    const questions = []
    questions.push(1, 2, 3)

    if (
      formData.contract_type === "employee_temporary" ||
      formData.contract_type === "employee_permanent"
    ) {
      questions.push(4, 5, 6)
    } else if (formData.contract_type === "freelance") {
      questions.push(7, 8, 9)  // 7 es la nueva pregunta de fecha de alta
    } else if (formData.contract_type === "pensioner" || formData.contract_type === "unemployed") {
      questions.push(10)  // Pensionistas y desempleados usan la misma pregunta
    }

    if (formData.contract_type) {
      questions.push(11)
    }

    questions.push(12, 13)
    return questions
  }

  // --- Validación de documentos requeridos ---
  const validateRequiredDocuments = () => {
    return getMissingDocuments().length === 0
  }

  // --- Obtener documentos faltantes ---
  const getMissingDocuments = () => {
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

  const isPhoneValidZod = phoneSchema.safeParse(formData.phone_mumber).success
  
  // ⚠️ DEBUG TEMPORAL - para ver qué condición está fallando
  const debugValidation = {
    validateRequiredDocuments: validateRequiredDocuments(),
    phoneValidationExists: phoneValidation.exists,
    isPhoneValidZod: isPhoneValidZod,
    phoneValidationError: phoneValidationError,
    missingDocsCount: getMissingDocuments().length,
    missingDocs: getMissingDocuments()
  }
  
  console.log("🔍 DEBUG VALIDACIÓN:", debugValidation)
  
  const isFormValid = validateRequiredDocuments() && !phoneValidation.exists && isPhoneValidZod && !phoneValidationError
  const visibleQuestions = getVisibleQuestions()

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-400 via-white to-gray-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header mejorado */}
          <div className="text-center flex flex-col justify-center items-center mb-12">
            <div className="items-center justify-center hidden lg:block  rounded-2xl mb-10">
              <img className="max-w-[500px]" src="/logomys.png" />
            </div>
            <div className="items-center justify-center block lg:hidden  rounded-2xl mb-10">
              <img className="max-w-[300px]" src="/logomyswide.png" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-archivoBlack uppercase">
              Solicitud de Financiación
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl font-archivo mx-auto">
              Completa el siguiente formulario para iniciar tu solicitud de
              financiación. Te guiaremos paso a paso para que sea rápido y
              sencillo.
            </p>
          </div>

          {/* Formulario con nuevo diseño */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-4 sm:p-12 space-y-10">
              {/* Pregunta 1: Datos Personales */}
              {visibleQuestions.includes(1) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-xl font-bold text-lg">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Datos Personales
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Correo Electrónico"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                    />

                    <div>
                      <FormInput
                        label="Teléfono"
                        name="phone_mumber"
                        type="tel"
                        required
                        value={formData.phone_mumber}
                        onChange={handleInputChange}
                        onBlur={handlePhoneBlur}
                        placeholder="+34 600 000 000"
                      />
                      {/* Estado de validación del teléfono */}
                      {formData.phone_mumber && formData.phone_mumber.trim().length >= 1 && (
                        <div className="mt-2">
                          {phoneValidationError ? (
                            <div className="flex items-center text-red-600 text-sm">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              {phoneValidationError}
                            </div>
                          ) : phoneValidation.isChecking ? (
                            <div className="flex items-center text-blue-600 text-sm">
                              <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                              Verificando número de teléfono...
                            </div>
                          ) : phoneValidation.exists === true ? (
                            <div className="flex items-center text-red-600 text-sm">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Ya existe una solicitud con este número
                            </div>
                          ) : phoneValidation.exists === false ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Número de teléfono disponible
                            </div>
                          ) : formData.phone_mumber.trim().length >= 9 ? (
                            <div className="text-gray-400 text-sm">
                              Validando formato...
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <FileInputEnhanced
                      id="identity_front_file_id"
                      label="Imagen del anverso del DNI"
                      file={files.identity_front_file_id}
                      onRemove={removeFile}
                      required={true}
                      onChange={handleFileChange}
                      disabled={submitting}
                      multiple={true}
                      documentType="dni_front"
                      onVerificationComplete={(result: any) =>
                        handleVerificationComplete("front", result)
                      }
                    />

                    <FileInputEnhanced
                      id="identity_back_file_id"
                      label="Imagen del reverso del DNI"
                      file={files.identity_back_file_id}
                      onRemove={removeFile}
                      required={true}
                      onChange={handleFileChange}
                      disabled={submitting}
                      multiple={true}
                      documentType="dni_back"
                      onVerificationComplete={(result: any) =>
                        handleVerificationComplete("back", result)
                      }
                    />

                    <FormSelect
                      label="Estado Civil"
                      name="civil_status"
                      required
                      value={formData.civil_status}
                      onChange={handleInputChange}
                    >
                      <option value="single">Soltero/a</option>
                      <option value="married">Casado/a</option>
                      <option value="divorced">Divorciado/a</option>
                      <option value="widowed">Viudo/a</option>
                    </FormSelect>

                    <p className="text-gray-400">
                      Es importante que las imágenes del DNI sean perfectamente
                      visibles, sin reflejos y con buena luz, de lo contrario
                      podrían ser rechazadas.
                    </p>

                    {formData.civil_status === "married" && (
                      <div className="md:col-span-2">
                        <FormInput
                          label="Régimen matrimonial"
                          name="marital_status_details"
                          value={formData.marital_status_details}
                          onChange={handleInputChange}
                          placeholder="Ej: Gananciales, Separación de bienes..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pregunta 2: Domicilio */}
              {visibleQuestions.includes(2) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-xl font-bold text-lg">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Domicilio Actual
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormInput
                        label="Dirección"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Calle, número, piso, puerta..."
                      />
                    </div>

                    <FormInput
                      label="Código Postal"
                      name="postal_code"
                      required
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      placeholder="28001"
                    />

                    <FormInput
                      label="Ciudad"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Madrid"
                    />

                    <FormInput
                      label="Provincia"
                      name="province"
                      required
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="Madrid"
                    />

                    <FormSelect
                      label="Tipo de Vivienda"
                      name="housing_type"
                      required
                      value={formData.housing_type}
                      onChange={handleInputChange}
                    >
                      <option value="rent">Alquiler</option>
                      <option value="owned">Propia (con hipoteca)</option>
                      <option value="owned_free">Propia (sin hipoteca)</option>
                      <option value="family">Familiar</option>
                      <option value="other">Otra</option>
                    </FormSelect>

                    {formData.housing_type === "other" && (
                      <FormInput
                        label="Especifique el tipo de vivienda"
                        name="housing_type_details"
                        value={formData.housing_type_details}
                        onChange={handleInputChange}
                        placeholder="Describe tu situación de vivienda"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Pregunta 3: Tipo de Ingresos */}
              {visibleQuestions.includes(3) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-xl font-bold text-lg">
                      3
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Tipo de Ingresos
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Ingresos Mensuales (€)"
                      name="income"
                      type="number"
                      required
                      value={formData.income}
                      onChange={handleInputChange}
                      placeholder="1800"
                    />

                    <FormSelect
                      label="Tipo de Contrato"
                      name="contract_type"
                      required
                      value={formData.contract_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="employee_permanent">
                        Cuenta ajena fijo
                      </option>
                      <option value="employee_temporary">
                        Cuenta ajena temporal
                      </option>
                      <option value="freelance">Autónomo</option>
                      <option value="pensioner">Pensionista</option>
                      <option value="unemployed">Desempleado</option>
                    </FormSelect>
                  </div>
                </div>
              )}

              {/* Preguntas 4-6: Empleados */}
              {visibleQuestions.includes(4) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-xl font-bold text-lg">
                      4
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Información Laboral
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Cargo en la empresa"
                      name="company_position"
                      required
                      value={formData.company_position}
                      onChange={handleInputChange}
                      placeholder="Desarrollador, Administrativo, etc."
                    />

                    <FormInput
                      label="Fecha de inicio en la empresa"
                      name="company_start_date"
                      type="date"
                      required
                      value={formData.company_start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {visibleQuestions.includes(5) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-xl font-bold text-lg">
                      5
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Documentación Laboral
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Las nóminas deben ser las dos más recientes, además en
                    formato PDF. No se aceptan imágenes.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileInputEnhanced
                      id="paysheet_file"
                      label="Primera nómina"
                      file={files.paysheet_file}
                      onRemove={removeFile}
                      required={true}
                      onChange={handleFileChange}
                      disabled={submitting}
                      documentType="payroll"
                      onVerificationComplete={(result: any) =>
                        handleVerificationComplete("payroll", result)
                      }
                    />

                    <FileInputEnhanced
                      id="paysheet_file_2"
                      label="Segunda nómina (opcional)"
                      file={files.paysheet_file_2}
                      onRemove={removeFile}
                      required={false}
                      onChange={handleFileChange}
                      disabled={submitting}
                      documentType="payroll"
                      onVerificationComplete={(result: any) =>
                        handleVerificationComplete("payroll_2", result)
                      }
                    />
                  </div>
                </div>
              )}

              {/* Pregunta 7: Fecha de alta de autónomos */}
              {visibleQuestions.includes(7) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl font-bold text-lg">
                      7
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Información de Alta como Autónomo
                    </h3>
                  </div>

                  <div className="max-w-md">
                    <FormInput
                      label="Fecha de alta como autónomo"
                      name="freelance_start_date"
                      type="date"
                      required
                      value={formData.freelance_start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* Preguntas 8-9: Autónomos */}
              {visibleQuestions.includes(8) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-600 rounded-xl font-bold text-lg">
                      8
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Documentación de Autónomo
                    </h3>
                  </div>

                  <FileInputEnhanced
                    id="freelance_rental_file"
                    label="Última declaración de la renta"
                    file={files.freelance_rental_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}

              {visibleQuestions.includes(9) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-teal-100 text-teal-600 rounded-xl font-bold text-lg">
                      9
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Cuota de Autónomos
                    </h3>
                  </div>

                  <FileInputEnhanced
                    id="freelance_quote_file"
                    label="Última cuota de autónomos"
                    file={files.freelance_quote_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}

              {/* Pregunta 10: Pensionistas y Desempleados */}
              {visibleQuestions.includes(10) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl font-bold text-lg">
                      10
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formData.contract_type === "pensioner" ? "Documentación de Pensión" : "Documentación de Desempleo"}
                    </h3>
                  </div>

                  <FileInputEnhanced
                    id="pensioner_proof_file"
                    label={formData.contract_type === "pensioner" ? "Justificante de pensión" : "Justificante de desempleo (paro, subsidio, etc.)"}
                    file={files.pensioner_proof_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                  
                  <p className="text-gray-500 text-sm">
                    {formData.contract_type === "pensioner" 
                      ? "Sube el último justificante de tu pensión." 
                      : "Sube el documento que acredite tu situación de desempleo (tarjeta de paro, subsidio, etc.)."}
                  </p>
                </div>
              )}

              {/* Pregunta 11: Justificante Bancario */}
              {visibleQuestions.includes(11) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl font-bold text-lg">
                      11
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Justificante Bancario
                    </h3>
                  </div>

                  <FileInputEnhanced
                    id="bank_account_proof_file"
                    label="Justificante de titularidad bancaria"
                    file={files.bank_account_proof_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                    documentType="bank_certificate"
                    onVerificationComplete={(result: any) =>
                      handleVerificationComplete("bank", result)
                    }
                  />
                </div>
              )}

              {/* Pregunta 12: Plazos de Financiación */}
              {visibleQuestions.includes(12) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-pink-100 text-pink-600 rounded-xl font-bold text-lg">
                      12
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Plazos de Financiación
                    </h3>
                  </div>

                  <div className="max-w-md">
                    <FormSelect
                      label="Plazos de financiación"
                      name="financing_installment_count"
                      required
                      value={formData.financing_installment_count}
                      onChange={handleInputChange}
                    >
                      <option value="12">12 meses</option>
                      <option value="24">24 meses</option>
                      <option value="36">36 meses</option>
                      <option value="48">48 meses</option>
                      <option value="60">60 meses</option>
                    </FormSelect>
                  </div>
                </div>
              )}

              {/* Pregunta 13: Comentarios */}
              {visibleQuestions.includes(13) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-violet-100 text-violet-600 rounded-xl font-bold text-lg">
                      13
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Comentarios Adicionales
                    </h3>
                  </div>

                  <FormTextarea
                    label="¿Tienes alguna duda o comentario?"
                    name="doubts"
                    value={formData.doubts}
                    onChange={handleInputChange}
                    placeholder="Escribe aquí si necesitas aclarar algo o tienes alguna pregunta..."
                    rows={5}
                  />
                </div>
              )}

              {/* Mensaje de error mejorado */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 border-t pt-10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Error en el envío
                      </h4>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de WhatsApp mejorado */}
              <div className="border-t border-gray-100 pt-10">
                {/* Mostrar mensaje de documentos faltantes */}
                {!isFormValid && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-800 mb-2">
                          Documentos requeridos pendientes
                        </h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {getMissingDocuments().map((doc, index) => (
                            <li key={index}>• {doc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || submitted || !isFormValid}
                  className={`w-full flex justify-center items-center py-4 px-8 font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 ${
                    submitted
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                      : !isFormValid
                      ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  }`}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                      Enviando solicitud...
                    </>
                  ) : submitted ? (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      ¡Enviado con éxito!
                    </>
                  ) : !isFormValid ? (
                    <>
                      <AlertCircle className="mr-3 h-6 w-6" />
                      Faltan {getMissingDocuments().length} documento{getMissingDocuments().length === 1 ? '' : 's'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      Enviar Solicitud
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  {submitted
                    ? "Redirigiendo a la página de confirmación..."
                    : !isFormValid
                    ? "Completa todos los documentos requeridos para continuar."
                    : "Al enviar esta solicitud, aceptas nuestros términos y condiciones de financiación."}
                </p>
              </div>
            </form>
          </div>
          <a
            href="https://wa.me/34633695703?text=Hola%20MyUrbanScoot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
            title="¿Necesitas ayuda? Contáctanos"
          >
            <WhatsApp className="w-6 h-6" />

            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              ¿Necesitas ayuda?
            </div>

            {/* Indicador de disponibilidad */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-300 border-2 border-white rounded-full animate-pulse"></div>
          </a>
        </div>
      </div>
    </>
  )
}
