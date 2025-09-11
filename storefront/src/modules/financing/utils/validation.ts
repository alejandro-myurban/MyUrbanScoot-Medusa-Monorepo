import { z } from "zod"

// Esquema de validación Zod para teléfono - EXTRAÍDO EXACTAMENTE DEL ORIGINAL
export const phoneSchema = z.string()
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

// Esquema comprehensivo de validación del formulario - EXTRAÍDO EXACTAMENTE DEL ORIGINAL
export const formSchema = z.object({
  // Datos personales
  email: z.string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido")
    .max(100, "Email demasiado largo")
    .refine((email) => {
      // Validaciones adicionales para emails más robustas
      const domain = email.split('@')[1]
      if (!domain) return false
      
      // No permitir dominios obviamente falsos
      const invalidDomains = ['test.com', '123.com', 'fake.com', 'example.com']
      return !invalidDomains.includes(domain.toLowerCase())
    }, {
      message: "Dirección de email no válida"
    }),
  
  phone_mumber: phoneSchema, // Mantener el schema existente
  
  // Dirección
  address: z.string()
    .min(1, "La dirección es requerida")
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(200, "Dirección demasiado larga")
    .refine((address) => {
      // Debe contener al menos un número y una palabra
      return /\d/.test(address) && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(address)
    }, {
      message: "La dirección debe incluir número y nombre de calle"
    }),
  
  postal_code: z.string()
    .min(1, "El código postal es requerido")
    .regex(/^\d{5}$/, "El código postal debe tener exactamente 5 dígitos")
    .refine((code) => {
      // Validar que sea un código postal español válido (01000-52999)
      const num = parseInt(code)
      return num >= 1000 && num <= 52999
    }, {
      message: "Código postal español no válido"
    }),
  
  city: z.string()
    .min(1, "La ciudad es requerida")
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .max(50, "Ciudad demasiado larga")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/, "La ciudad solo puede contener letras, espacios, guiones y puntos"),
  
  province: z.string()
    .min(1, "La provincia es requerida")
    .min(2, "La provincia debe tener al menos 2 caracteres")
    .max(50, "Provincia demasiado larga")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/, "La provincia solo puede contener letras, espacios, guiones y puntos"),
  
  // Información laboral y financiera
  income: z.string()
    .min(1, "Los ingresos son requeridos")
    .regex(/^\d+$/, "Los ingresos deben ser un número")
    .refine((income) => {
      const num = parseInt(income)
      return num >= 400 && num <= 50000
    }, {
      message: "Los ingresos deben estar entre 400€ y 50.000€"
    }),
  
  contract_type: z.enum(["employee_permanent", "employee_temporary", "freelance", "pensioner", "unemployed"], {
    errorMap: () => ({ message: "Selecciona un tipo de contrato válido" })
  }),
  
  // Estado civil
  civil_status: z.enum(["single", "married", "divorced", "widowed"], {
    errorMap: () => ({ message: "Selecciona un estado civil válido" })
  }),
  
  // Tipo de vivienda
  housing_type: z.enum(["rent", "owned", "owned_free", "family", "other"], {
    errorMap: () => ({ message: "Selecciona un tipo de vivienda válido" })
  }),
  
  // Plazos de financiación
  financing_installment_count: z.enum(["12", "24", "36", "48", "60"], {
    errorMap: () => ({ message: "Selecciona un plazo de financiación válido" })
  }),
  
  // Campos opcionales
  company_position: z.string().optional(),
  company_start_date: z.string().optional(),
  freelance_start_date: z.string().optional(),
  housing_type_details: z.string().optional(),
  marital_status_details: z.string().optional(),
  doubts: z.string().optional(),
  
  // Campos ocultos/internos - sin validación estricta
  identity: z.string().optional(),
  paysheet_file_id: z.string().nullable().optional(),
  freelance_rental_file_id: z.string().nullable().optional(),
  freelance_quote_file_id: z.string().nullable().optional(),
  pensioner_proof_file_id: z.string().nullable().optional(),
  bank_account_proof_file_id: z.string().nullable().optional(),
})

// Validaciones condicionales basadas en contract_type - EXTRAÍDAS EXACTAMENTE DEL ORIGINAL
.refine((data) => {
  if ((data.contract_type === "employee_permanent" || data.contract_type === "employee_temporary") && !data.company_position) {
    return false
  }
  return true
}, {
  message: "El cargo en la empresa es requerido para empleados",
  path: ["company_position"]
})
.refine((data) => {
  if ((data.contract_type === "employee_permanent" || data.contract_type === "employee_temporary") && !data.company_start_date) {
    return false
  }
  return true
}, {
  message: "La fecha de inicio en la empresa es requerida para empleados",
  path: ["company_start_date"]
})
.refine((data) => {
  if (data.contract_type === "freelance" && !data.freelance_start_date) {
    return false
  }
  return true
}, {
  message: "La fecha de alta como autónomo es requerida",
  path: ["freelance_start_date"]
})
.refine((data) => {
  if (data.civil_status === "married" && !data.marital_status_details) {
    return false
  }
  return true
}, {
  message: "Especifica el régimen matrimonial",
  path: ["marital_status_details"]
})
.refine((data) => {
  if (data.housing_type === "other" && !data.housing_type_details) {
    return false
  }
  return true
}, {
  message: "Especifica el tipo de vivienda",
  path: ["housing_type_details"]
})

// Validar edad mínima (18 años)
export const validateAge = (birthDate: string): { isValid: boolean; age?: number; message?: string } => {
  if (!birthDate) {
    return {
      isValid: false,
      message: 'Fecha de nacimiento requerida'
    };
  }

  let birth: Date;
  
  // Parsear formato español DNI: "DD MM YYYY"
  if (/^\d{2} \d{2} \d{4}$/.test(birthDate.trim())) {
    const [day, month, year] = birthDate.trim().split(' ');
    // Crear fecha con formato ISO: YYYY-MM-DD
    birth = new Date(`${year}-${month}-${day}`);
  } else {
    // Intentar parsear otros formatos
    birth = new Date(birthDate);
  }
  
  // Verificar que la fecha sea válida
  if (isNaN(birth.getTime())) {
    return {
      isValid: false,
      message: 'Fecha de nacimiento inválida'
    };
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 18) {
    return {
      isValid: false,
      age,
      message: `Debes ser mayor de edad para acceder a financiación (edad actual: ${age} años)`
    };
  }

  return {
    isValid: true,
    age,
    message: `Edad validada correctamente: ${age} años`
  };
};

// Validar edad desde datos extraídos del DNI
export const validateAgeFromDNI = (extractedDniData: any): { isValid: boolean; age?: number; message?: string } => {
  if (!extractedDniData || !extractedDniData.birthDate) {
    return {
      isValid: false,
      message: 'No se pudo extraer la fecha de nacimiento del DNI'
    };
  }

  return validateAge(extractedDniData.birthDate);
};

// Función helper para validar un campo individual - EXTRAÍDA DEL ORIGINAL
export const validateField = (fieldName: string, value: string, currentFormData?: any) => {
  try {
    // Validaciones específicas para cada campo
    if (fieldName === "email") {
      const emailSchema = z.string().min(1, "El email es requerido").email("Formato de email inválido")
      emailSchema.parse(value)
    }
    else if (fieldName === "postal_code") {
      const postalSchema = z.string()
        .min(1, "El código postal es requerido")
        .regex(/^\d{5}$/, "El código postal debe tener exactamente 5 dígitos")
        .refine((code) => {
          const num = parseInt(code)
          return num >= 1000 && num <= 52999
        }, { message: "Código postal español no válido" })
      postalSchema.parse(value)
    }
    else if (fieldName === "phone_mumber") {
      phoneSchema.parse(value)
    }
    else if (fieldName === "address") {
      const addressSchema = z.string()
        .min(1, "La dirección es requerida")
        .min(5, "La dirección debe tener al menos 5 caracteres")
        .refine((address) => /\d/.test(address) && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(address), {
          message: "La dirección debe incluir número y nombre de calle"
        })
      addressSchema.parse(value)
    }
    else if (fieldName === "city") {
      const citySchema = z.string()
        .min(1, "La ciudad es requerida")
        .min(2, "La ciudad debe tener al menos 2 caracteres")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/, "La ciudad solo puede contener letras, espacios, guiones y puntos")
      citySchema.parse(value)
    }
    else if (fieldName === "province") {
      const provinceSchema = z.string()
        .min(1, "La provincia es requerida")
        .min(2, "La provincia debe tener al menos 2 caracteres")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/, "La provincia solo puede contener letras, espacios, guiones y puntos")
      provinceSchema.parse(value)
    }
    else if (fieldName === "income") {
      const incomeSchema = z.string()
        .min(1, "Los ingresos son requeridos")
        .regex(/^\d+$/, "Los ingresos deben ser un número")
        .refine((income) => {
          const num = parseInt(income)
          return num >= 400 && num <= 50000
        }, { message: "Los ingresos deben estar entre 400€ y 50.000€" })
      incomeSchema.parse(value)
    }
    else if (fieldName === "company_position") {
      if ((currentFormData?.contract_type === "employee_permanent" || currentFormData?.contract_type === "employee_temporary") && !value) {
        throw new Error("El cargo en la empresa es requerido para empleados")
      }
    }
    else if (fieldName === "company_start_date") {
      if ((currentFormData?.contract_type === "employee_permanent" || currentFormData?.contract_type === "employee_temporary") && !value) {
        throw new Error("La fecha de inicio en la empresa es requerida para empleados")
      }
    }
    else if (fieldName === "freelance_start_date") {
      if (currentFormData?.contract_type === "freelance" && !value) {
        throw new Error("La fecha de alta como autónomo es requerida")
      }
    }
    else if (fieldName === "marital_status_details") {
      if (currentFormData?.civil_status === "married" && !value) {
        throw new Error("Especifica el régimen matrimonial")
      }
    }
    else if (fieldName === "housing_type_details") {
      if (currentFormData?.housing_type === "other" && !value) {
        throw new Error("Especifica el tipo de vivienda")
      }
    }
    
    return { success: true, error: null }
    
  } catch (error: any) {
    // Extraer mensaje limpio del error de Zod
    let errorMessage = ""
    
    // Si es un error de Zod con issues
    if (error?.issues && Array.isArray(error.issues) && error.issues.length > 0) {
      errorMessage = error.issues[0].message
    } 
    // Si es un error simple con mensaje
    else if (error?.message && typeof error.message === 'string') {
      errorMessage = error.message
    }
    // Si no hay mensaje válido, usar mensajes amigables
    else {
      const friendlyMessages: Record<string, string> = {
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
        housing_type_details: "Especifica tu tipo de vivienda"
      }
      errorMessage = friendlyMessages[fieldName] || "Por favor, revisa este campo"
    }
    
    return { success: false, error: errorMessage }
  }
}