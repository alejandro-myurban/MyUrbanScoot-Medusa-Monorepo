// lib/schemas/contact-form.schema.ts
import { z } from "zod"

// =====================================
// SCHEMAS Y TIPOS
// =====================================

// Schema principal del formulario de contacto
export const contactFormSchema = z.object({
  fullName: z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, "El nombre solo puede contener letras y espacios"),

  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Por favor, introduce un email válido")
    .max(50, "El email no puede exceder 50 caracteres")
    .toLowerCase(),

  subject: z
    .string()
    .max(50, "El asunto no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .regex(/^(\+\d{1,3}[- ]?)?\d{9,15}$/, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),

  message: z
    .string()
    .min(1, "El mensaje es obligatorio")
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(2000, "El mensaje no puede exceder 2000 caracteres")
    .trim(),
})

// Tipo TypeScript derivado del schema
export type ContactFormData = z.infer<typeof contactFormSchema>

// Schema para validaciones específicas del campo (útil para validaciones en tiempo real)
export const contactFormFieldSchemas = {
  fullName: contactFormSchema.shape.fullName,
  email: contactFormSchema.shape.email,
  subject: contactFormSchema.shape.subject,
  phone: contactFormSchema.shape.phone,
  message: contactFormSchema.shape.message,
}

// =====================================
// FUNCIONES DE VALIDACIÓN
// =====================================

// Función de validación completa con manejo de errores
export const validateContactForm = (data: unknown) => {
  try {
    return {
      success: true,
      data: contactFormSchema.parse(data),
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

// Función para validar un campo específico
export const validateContactFormField = (fieldName: keyof ContactFormData, value: unknown) => {
  try {
    const fieldSchema = contactFormFieldSchemas[fieldName]
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

// Estados de envío del formulario
export type SubmissionStatus = "idle" | "success" | "error"

// Props para componentes de formulario
export interface ContactFormProps {
  formData: ContactFormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  loading: boolean
  validationErrors?: Record<string, string[]> | null
}

// Props para display de estado
export interface SubmissionStatusProps {
  loading: boolean
  submissionStatus: SubmissionStatus
  errorMessage: string
  onTryAgain: () => void
}

// Configuración de campos del formulario
export const contactFormConfig = {
  fields: {
    fullName: {
      label: "Nombre completo",
      placeholder: "Tu nombre completo",
      type: "text" as const,
      required: true,
    },
    email: {
      label: "Email",
      placeholder: "tu@email.com",
      type: "email" as const,
      required: true,
    },
    subject: {
      label: "Asunto",
      placeholder: "¿En qué podemos ayudarte?",
      type: "text" as const,
      required: false,
    },
    phone: {
      label: "Teléfono",
      placeholder: "+34 612 345 678",
      type: "tel" as const,
      required: false,
    },
    message: {
      label: "Mensaje",
      placeholder: "Escribe tu mensaje aquí...",
      type: "textarea" as const,
      required: true,
      rows: 5,
    },
  },
}

// Mensajes de éxito
export const contactFormMessages = {
  success: {
    title: "¡Mensaje enviado con éxito!",
    description: "Hemos recibido tu mensaje y te responderemos lo antes posible.",
  },
  error: {
    title: "Error al enviar el mensaje",
    description: "Por favor, inténtalo de nuevo o contacta con nosotros directamente.",
  },
  loading: {
    title: "Enviando mensaje...",
    description: "Por favor, espera mientras procesamos tu solicitud.",
  },
}