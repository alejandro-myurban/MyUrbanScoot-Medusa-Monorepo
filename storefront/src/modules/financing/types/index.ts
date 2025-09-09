import type React from "react"

// --- Tipos de datos principales (extraídos del original) ---
export interface FinancingFormData {
  email: string
  identity: string
  income: string
  paysheet_file_id: string | null
  contract_type: string
  company_position: string
  company_start_date: string
  freelance_rental_file_id: string | null
  freelance_quote_file_id: string | null
  freelance_start_date: string
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

// Estados de archivos (importado del componente file-input existente)
export interface FileStates {
  identity_front_file_id: File | null
  identity_back_file_id: File | null
  paysheet_file: File | null
  paysheet_file_2: File | null
  freelance_rental_file: File | null
  freelance_quote_file: File | null
  pensioner_proof_file: File | null
  bank_account_proof_file: File | null
}

// Estado de validación de teléfono (extraído del original)
export interface PhoneValidationState {
  isChecking: boolean
  exists: boolean | null
  message: string
}

// Verificaciones de documentos (extraído del original)
export interface DocumentVerifications {
  front?: any
  back?: any
  payroll?: any
  payroll_2?: any
  bank?: any
}

// --- Props de componentes ---
export interface FormSectionProps {
  formData: FinancingFormData
  files: FileStates
  fieldErrors: Record<string, string>
  documentVerifications: DocumentVerifications
  phoneValidation: PhoneValidationState
  phoneValidationError: string | null
  submitting: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onFieldBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onPhoneBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (fileName: keyof FileStates) => void
  onVerificationComplete: (type: "front" | "back" | "payroll" | "payroll_2" | "bank", result: any) => void
  getFieldError: (fieldName: string) => string | null
}

export interface QuestionHeaderProps {
  number: number
  title: string
  bgColor?: string
  textColor?: string
}

export interface ValidationMessageProps {
  message: string | null
  type?: 'error' | 'success' | 'warning' | 'info'
}

export interface PhoneValidatorProps {
  value: string
  phoneValidation: PhoneValidationState
  phoneValidationError: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export interface UnemployedBlockerProps {
  isVisible: boolean
}

// --- Hooks Props ---
export interface UseFinancingFormReturn {
  formData: FinancingFormData
  files: FileStates
  submitting: boolean
  submitted: boolean
  isUnemployed: boolean
  error: string | null
  documentVerifications: DocumentVerifications
  visibleQuestions: number[]
  setFormData: (data: FinancingFormData | ((prev: FinancingFormData) => FinancingFormData)) => void
  setFiles: (files: FileStates | ((prev: FileStates) => FileStates)) => void
  setIsUnemployed: (value: boolean) => void
  setDocumentVerifications: (verifications: DocumentVerifications | ((prev: DocumentVerifications) => DocumentVerifications)) => void
  setSubmitting: (value: boolean) => void
  setSubmitted: (value: boolean) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (fileName: keyof FileStates) => void
  handleVerificationComplete: (type: "front" | "back" | "payroll" | "payroll_2" | "bank", result: any) => void
  // Métodos de control de submit (anti-double-submit)
  lockSubmit: () => void
  unlockSubmit: () => void
  canSubmit: () => { allowed: boolean; reason?: string }
}

export interface UseFormValidationReturn {
  fieldErrors: Record<string, string>
  validateField: (fieldName: string, value: string, currentFormData?: Partial<FinancingFormData>) => void
  validateFieldImmediate: (fieldName: string, value: string) => void
  getFieldError: (fieldName: string) => string | null
  validateRequiredDocuments: () => boolean
  getMissingDocuments: () => string[]
  isFormValid: boolean
}

export interface UsePhoneValidationReturn {
  phoneValidation: PhoneValidationState
  phoneValidationError: string | null
  validatePhoneWithZod: (phoneNumber: string) => void
  checkPhoneExists: (phoneNumber: string) => Promise<void>
  handlePhoneBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  handleFieldBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handlePhoneInputChange: (value: string) => void
}

export interface UseFormSubmissionReturn {
  handleSubmit: (e: React.FormEvent) => Promise<void>
  uploadFile: (file: File) => Promise<string>
}

// --- Tipos auxiliares ---
export type ContractType = "employee_permanent" | "employee_temporary" | "freelance" | "pensioner" | "unemployed"
export type CivilStatus = "single" | "married" | "divorced" | "widowed"
export type HousingType = "rent" | "owned" | "owned_free" | "family" | "other"
export type FinancingInstallments = "12" | "24" | "36" | "48" | "60"

export interface SelectOption {
  value: string
  label: string
}

// Tipo para los errores de validación de Zod
export interface ValidationResult {
  success: boolean
  error: string | null
}