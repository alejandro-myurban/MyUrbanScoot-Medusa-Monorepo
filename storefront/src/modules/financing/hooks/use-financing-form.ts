"use client"

import { useState } from "react"
import { validateAgeFromDNI } from "../utils/validation"
import type { 
  FinancingFormData, 
  FileStates, 
  DocumentVerifications,
  UseFinancingFormReturn 
} from "../types"

// Estado inicial del formulario (extraído del original)
const INITIAL_FORM_DATA: FinancingFormData = {
  email: "",
  identity: "",
  income: "",
  paysheet_file_id: null,
  contract_type: "",
  company_position: "",
  company_start_date: "",
  freelance_rental_file_id: null,
  freelance_quote_file_id: null,
  freelance_start_date: "",
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
}

// Estado inicial de archivos (extraído del original)
const INITIAL_FILE_STATES: FileStates = {
  identity_front_file_id: null,
  identity_back_file_id: null,
  paysheet_file: null,
  paysheet_file_2: null,
  freelance_rental_file: null,
  freelance_quote_file: null,
  pensioner_proof_file: null,
  bank_account_proof_file: null,
}

// Estado inicial de verificaciones de documentos (extraído del original)
const INITIAL_DOCUMENT_VERIFICATIONS: DocumentVerifications = {}

export const useFinancingForm = (): UseFinancingFormReturn => {
  // Estados principales (extraídos del original)
  const [formData, setFormData] = useState<FinancingFormData>(INITIAL_FORM_DATA)
  const [files, setFiles] = useState<FileStates>(INITIAL_FILE_STATES)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isUnemployed, setIsUnemployed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentVerifications, setDocumentVerifications] = useState<DocumentVerifications>(INITIAL_DOCUMENT_VERIFICATIONS)
  
  // Estado adicional para prevenir double-submit
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0)

  // Función para determinar qué preguntas mostrar (extraída del original)
  const getVisibleQuestions = (): number[] => {
    const questions = []
    questions.push(1, 2, 3)

    // Si el usuario está desempleado, no mostrar más preguntas (bloqueo)
    if (isUnemployed) {
      return questions
    }

    if (
      formData.contract_type === "employee_temporary" ||
      formData.contract_type === "employee_permanent"
    ) {
      questions.push(4, 5, 6)
    } else if (formData.contract_type === "freelance") {
      questions.push(7, 8, 9)  // 7 es la nueva pregunta de fecha de alta
    } else if (formData.contract_type === "pensioner") {
      questions.push(10)  // Solo pensionistas, desempleados quedan bloqueados
    }

    if (formData.contract_type) {
      questions.push(11)
    }

    questions.push(12, 13)
    return questions
  }

  // Manejador de cambios de input (extraído del original con lógica específica removida)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    setFormData(newFormData)

    // Detectar si el usuario selecciona "unemployed" (desempleado)
    if (name === "contract_type") {
      setIsUnemployed(value === "unemployed")
    }
  }

  // Manejador de cambios de archivo (extraído del original)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target
    if (inputFiles && inputFiles.length > 0) {
      const file = inputFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        // toast.error(`El archivo ${file.name} es demasiado grande (máx 10MB).`)
        console.error(`El archivo ${file.name} es demasiado grande (máx 10MB).`)
        return
      }
      setFiles((prev) => ({ ...prev, [name]: file }))
    }
  }

  // Función para remover archivo (extraída del original)
  const removeFile = (fileName: keyof FileStates) => {
    setFiles((prev) => ({ ...prev, [fileName]: null }))
    setFormData((prev) => ({ ...prev, [`${fileName}_id`]: null }))
  }

  // Manejador de verificación completa (extraído del original)
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

  // Métodos de control de submit (para prevenir double-submit)
  const lockSubmit = () => {
    console.log("🔒 Bloqueando submit para prevenir duplicados")
    setSubmitting(true)
    setLastSubmitTime(Date.now())
  }

  const unlockSubmit = () => {
    console.log("🔓 Desbloqueando submit")
    setSubmitting(false)
  }

  const canSubmit = (): { allowed: boolean; reason?: string } => {
    const now = Date.now()
    const timeSinceLastSubmit = now - lastSubmitTime
    const MIN_SUBMIT_INTERVAL = 3000 // 3 segundos mínimo entre submits

    if (submitting) {
      return { allowed: false, reason: "Ya se está enviando la solicitud..." }
    }

    if (submitted) {
      return { allowed: false, reason: "La solicitud ya fue enviada" }
    }

    if (timeSinceLastSubmit < MIN_SUBMIT_INTERVAL && lastSubmitTime > 0) {
      const remainingTime = Math.ceil((MIN_SUBMIT_INTERVAL - timeSinceLastSubmit) / 1000)
      return { 
        allowed: false, 
        reason: `Espera ${remainingTime} segundo${remainingTime !== 1 ? 's' : ''} antes de intentar de nuevo` 
      }
    }

    // Validar edad mínima desde datos extraídos del DNI - CORREGIR keys
    const dniData = documentVerifications?.front?.extractedData || documentVerifications?.back?.extractedData;
    if (dniData) {
      const ageValidation = validateAgeFromDNI(dniData);
      // Solo bloquear si la validación falla Y no es por problemas de extracción
      if (!ageValidation.isValid && !ageValidation.skipValidation) {
        return { 
          allowed: false, 
          reason: ageValidation.message || "Edad mínima requerida: 18 años"
        }
      }
    }

    return { allowed: true }
  }

  const visibleQuestions = getVisibleQuestions()

  return {
    // Estados
    formData,
    files,
    submitting,
    submitted,
    isUnemployed,
    error,
    documentVerifications,
    visibleQuestions,
    
    // Setters (para permitir modificación desde hooks especializados)
    setFormData,
    setFiles,
    setIsUnemployed,
    setDocumentVerifications,
    setSubmitting, // Expuesto para control directo
    setSubmitted,
    
    // Handlers
    handleInputChange,
    handleFileChange,
    removeFile,
    handleVerificationComplete,
    
    // Métodos de control de submit (anti-double-submit)
    lockSubmit,
    unlockSubmit,
    canSubmit,
  }
}