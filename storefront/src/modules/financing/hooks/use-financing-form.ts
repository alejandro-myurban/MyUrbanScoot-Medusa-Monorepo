"use client"

import { useState } from "react"
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
    
    // Handlers
    handleInputChange,
    handleFileChange,
    removeFile,
    handleVerificationComplete,
  }
}