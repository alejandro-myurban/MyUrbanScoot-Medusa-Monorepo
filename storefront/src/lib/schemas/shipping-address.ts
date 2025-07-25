// lib/schemas/shipping-address.schema.ts
import { z } from "zod"

// =====================================
// SCHEMAS Y TIPOS
// =====================================

// Schema para dirección de envío
export const shippingAddressSchema = z.object({
  "shipping_address.first_name": z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, "El nombre solo puede contener letras, espacios, guiones y apostrofes"),

  "shipping_address.last_name": z
    .string()
    .min(1, "El apellido es obligatorio")
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, "El apellido solo puede contener letras, espacios, guiones y apostrofes"),

  "shipping_address.address_1": z
    .string()
    .min(1, "La dirección es obligatoria")
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(100, "La dirección no puede exceder 100 caracteres"),

  "shipping_address.company": z
    .string()
    .max(100, "El nombre de la empresa no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  "shipping_address.postal_code": z
    .string()
    .min(1, "El código postal es obligatorio")
    .regex(/^[0-9A-Za-z\s-]{3,10}$/, "Formato de código postal inválido"),

  "shipping_address.city": z
    .string()
    .min(1, "La ciudad es obligatoria")
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .max(50, "La ciudad no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, "La ciudad solo puede contener letras, espacios, guiones y apostrofes"),

  "shipping_address.country_code": z
    .string()
    .min(1, "El país es obligatorio")
    .length(2, "El código de país debe tener 2 caracteres")
    .toUpperCase(),

  "shipping_address.province": z
    .string()
    .min(1, "La provincia/estado es obligatorio")
    .max(50, "La provincia no puede exceder 50 caracteres"),

  "shipping_address.phone": z
    .string()
    .min(1, "El teléfono es obligatorio")
    .regex(/^\+\d{1,3}\d{9,15}$/, "El teléfono tiene que tener mínimo 9 dígitos y máximo 15"),

  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Por favor, introduce un email válido")
    .max(255, "El email no puede exceder 255 caracteres")
    .toLowerCase(),
})

// Schema para dirección de facturación (opcional)
export const billingAddressSchema = z.object({
  "billing_address.first_name": z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, "El nombre solo puede contener letras, espacios, guiones y apostrofes"),

  "billing_address.last_name": z
    .string()
    .min(1, "El apellido es obligatorio")
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, "El apellido solo puede contener letras, espacios, guiones y apostrofes"),

  "billing_address.address_1": z
    .string()
    .min(1, "La dirección es obligatoria")
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(100, "La dirección no puede exceder 100 caracteres"),

  "billing_address.company": z
    .string()
    .max(100, "El nombre de la empresa no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  "billing_address.postal_code": z
    .string()
    .min(1, "El código postal es obligatorio")
    .regex(/^[0-9A-Za-z\s-]{3,10}$/, "Formato de código postal inválido"),

  "billing_address.city": z
    .string()
    .min(1, "La ciudad es obligatoria")
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .max(50, "La ciudad no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, "La ciudad solo puede contener letras, espacios, guiones y apostrofes"),

  "billing_address.country_code": z
    .string()
    .min(1, "El país es obligatorio")
    .length(2, "El código de país debe tener 2 caracteres")
    .toUpperCase(),

  "billing_address.province": z
    .string()
    .min(1, "La provincia/estado es obligatorio")
    .max(50, "La provincia no puede exceder 50 caracteres"),
})

// Schema combinado (shipping + billing opcional)
export const addressFormSchema = z.object({
  ...shippingAddressSchema.shape,
  same_as_billing: z.boolean().optional(),
}).and(
  z.union([
    z.object({ same_as_billing: z.literal(true) }),
    z.object({ 
      same_as_billing: z.literal(false).or(z.undefined()),
      ...billingAddressSchema.shape 
    })
  ])
)

// Tipos TypeScript derivados
export type ShippingAddressData = z.infer<typeof shippingAddressSchema>
export type BillingAddressData = z.infer<typeof billingAddressSchema>
export type AddressFormData = z.infer<typeof addressFormSchema>

// =====================================
// FUNCIONES DE VALIDACIÓN
// =====================================

// Validación solo de shipping address
export const validateShippingAddress = (data: unknown) => {
  try {
    return {
      success: true,
      data: shippingAddressSchema.parse(data),
      errors: null,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.flatten().fieldErrors,
      }
    }
    return {
      success: false,
      data: null,
      errors: { general: ["Error de validación desconocido"] },
    }
  }
}

// Validación completa del formulario de direcciones
export const validateAddressForm = (data: unknown) => {
  try {
    return {
      success: true,
      data: addressFormSchema.parse(data),
      errors: null,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.flatten().fieldErrors,
      }
    }
    return {
      success: false,
      data: null,
      errors: { general: ["Error de validación desconocido"] },
    }
  }
}

// Validación de un campo específico
export const validateAddressField = (fieldName: string, value: unknown) => {
  try {
    // Buscar el campo en el schema apropiado
    const shippingField = shippingAddressSchema.shape[fieldName as keyof typeof shippingAddressSchema.shape]
    const billingField = billingAddressSchema.shape[fieldName as keyof typeof billingAddressSchema.shape]
    
    const fieldSchema = shippingField || billingField
    
    if (!fieldSchema) {
      return { success: true, error: null } // Campo no encontrado = válido
    }
    
    fieldSchema.parse(value)
    return { success: true, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Error de validación" 
      }
    }
    return { success: false, error: "Error de validación desconocido" }
  }
}

// =====================================
// UTILIDADES Y HELPERS
// =====================================

// Configuración de campos para shipping address
export const shippingAddressConfig = {
  fields: {
    "shipping_address.first_name": {
      label: "Nombre",
      placeholder: "Tu nombre",
      type: "text" as const,
      required: true,
    },
    "shipping_address.last_name": {
      label: "Apellidos",
      placeholder: "Tus apellidos",
      type: "text" as const,
      required: true,
    },
    "shipping_address.address_1": {
      label: "Dirección",
      placeholder: "Calle y número",
      type: "text" as const,
      required: true,
    },
    "shipping_address.company": {
      label: "Empresa (opcional)",
      placeholder: "Nombre de la empresa",
      type: "text" as const,
      required: false,
    },
    "shipping_address.postal_code": {
      label: "Código postal",
      placeholder: "28001",
      type: "text" as const,
      required: true,
    },
    "shipping_address.city": {
      label: "Ciudad",
      placeholder: "Madrid",
      type: "text" as const,
      required: true,
    },
    "shipping_address.province": {
      label: "Provincia",
      placeholder: "Madrid",
      type: "text" as const,
      required: true,
    },
    "shipping_address.phone": {
      label: "Teléfono",
      placeholder: "+34612345678",
      type: "tel" as const,
      required: true,
    },
    email: {
      label: "Email",
      placeholder: "tu@email.com",
      type: "email" as const,
      required: true,
    },
  },
}

// Función para limpiar datos del formulario
export const sanitizeAddressData = (data: Record<string, any>) => {
  const sanitized: Record<string, any> = {}
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitized[key] = value.trim()
    } else {
      sanitized[key] = value
    }
  })
  
  return sanitized
}

// Función para obtener solo los campos de shipping address
export const extractShippingAddress = (formData: Record<string, any>) => {
  const shippingFields = Object.keys(shippingAddressSchema.shape)
  const shipping: Record<string, any> = {}
  
  shippingFields.forEach(field => {
    if (formData[field] !== undefined) {
      shipping[field] = formData[field]
    }
  })
  
  return shipping
}

// Función para obtener solo los campos de billing address
export const extractBillingAddress = (formData: Record<string, any>) => {
  const billingFields = Object.keys(billingAddressSchema.shape)
  const billing: Record<string, any> = {}
  
  billingFields.forEach(field => {
    if (formData[field] !== undefined) {
      billing[field] = formData[field]
    }
  })
  
  return billing
}