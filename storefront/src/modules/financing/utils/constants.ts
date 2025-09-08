// Constantes extraídas del formulario original para mantener consistencia

// Mensajes de error amigables por campo
export const FRIENDLY_FIELD_MESSAGES: Record<string, string> = {
  email: "Por favor, introduce un email válido",
  postal_code: "El código postal debe tener 5 dígitos",
  phone_mumber: "Por favor, introduce un teléfono válido",
  address: "La dirección debe incluir número y nombre de calle",
  city: "Por favor, introduce una ciudad válida",
  province: "Por favor, introduce una provincia válida",
  income: "Los ingresos deben ser un número entre 400€ y 50.000€",
  company_position: "Este campo es obligatorio para empleados",
  company_start_date: "Este campo es obligatorio para empleados",
  freelance_start_date: "Este campo es obligatorio para autónomos",
  marital_status_details: "Este campo es obligatorio si estás casado/a",
  housing_type_details: "Especifica tu tipo de vivienda",
}

// Etiquetas de campos para mostrar en errores de validación
export const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  phone_mumber: "Teléfono",
  address: "Dirección",
  postal_code: "Código postal",
  city: "Ciudad",
  province: "Provincia",
  income: "Ingresos",
  contract_type: "Tipo de contrato",
  civil_status: "Estado civil",
  housing_type: "Tipo de vivienda",
  financing_installment_count: "Plazos de financiación",
  company_position: "Cargo en la empresa",
  company_start_date: "Fecha de inicio en la empresa",
  freelance_start_date: "Fecha de alta como autónomo",
  marital_status_details: "Detalles del estado civil",
  housing_type_details: "Detalles del tipo de vivienda",
}

// Opciones para selects - extraídas del JSX original
export const CIVIL_STATUS_OPTIONS = [
  { value: "single", label: "Soltero/a" },
  { value: "married", label: "Casado/a" },
  { value: "divorced", label: "Divorciado/a" },
  { value: "widowed", label: "Viudo/a" },
]

export const HOUSING_TYPE_OPTIONS = [
  { value: "rent", label: "Alquiler" },
  { value: "owned", label: "Propiedad" },
  { value: "partner", label: "Cónyuge" },
  { value: "family", label: "Padres" },
  { value: "leasing", label: "Leasing" },
  { value: "usufruct", label: "Usufructo" },
  { value: "other", label: "Otra" },
]

export const CONTRACT_TYPE_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "employee_permanent", label: "Cuenta ajena fijo" },
  { value: "employee_temporary", label: "Cuenta ajena temporal" },
  { value: "freelance", label: "Autónomo" },
  { value: "pensioner", label: "Pensionista" },
  { value: "unemployed", label: "Desempleado" },
]

export const FINANCING_INSTALLMENT_OPTIONS = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "48", label: "48 meses" },
  { value: "60", label: "60 meses" },
]

// Configuración de timeouts para validaciones (extraídos del original)
export const VALIDATION_TIMEOUTS = {
  PHONE_ZOD: 1500, // Timeout para validación Zod del teléfono
  PHONE_DUPLICATES: 2000, // Timeout para validación de duplicados
  FIELD_VALIDATION: 1500, // Timeout para validación de otros campos
}

// URLs y endpoints
export const API_ENDPOINTS = {
  CHECK_PHONE: "/api/store/financing-data/check-phone",
  SUBMIT_FORM: "/store/financing-data",
  UPLOAD_FILE: "/api/upload-file",
}

// Configuración de archivos
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
}

// Mapeo de archivos para upload (extraído del original)
export const FILE_MAPPING: Record<string, string> = {
  identity_front_file_id: "identity_front_file_id",
  identity_back_file_id: "identity_back_file_id",
  freelance_rental_file: "freelance_rental_file_id",
  freelance_quote_file: "freelance_quote_file_id",
  pensioner_proof_file: "pensioner_proof_file_id",
  bank_account_proof_file: "bank_account_proof_file_id",
}

// Configuración de WhatsApp
export const WHATSAPP_CONFIG = {
  PHONE_GENERAL: "34633695703",
  PHONE_FINANCING: "34647744525",
  MESSAGE_GENERAL: "Hola%20MyUrbanScoot.com",
  MESSAGE_FINANCING:
    "Hola,%20me%20interesa%20información%20sobre%20financiación%20y%20tengo%20una%20situación%20especial",
}

// URLs de redirección
export const REDIRECT_URLS = {
  SUCCESS: "/es/financing-success",
}
