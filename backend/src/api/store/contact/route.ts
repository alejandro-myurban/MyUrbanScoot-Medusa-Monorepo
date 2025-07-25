// src/api/store/contact/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { z } from "zod"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"

// Schema de validación
const contactSchema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  subject: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(1, "El mensaje es obligatorio"),
})

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Validar datos de entrada
    const validatedData = contactSchema.parse(req.body)
    const { fullName, email, subject, phone, message } = validatedData

    console.log("📧 Procesando mensaje de contacto:", { fullName, email, subject })

    // Resolver el servicio de notificaciones
    const notificationModuleService: INotificationModuleService = 
      req.scope.resolve(Modules.NOTIFICATION)

    // Enviar email usando Resend
    await notificationModuleService.createNotifications({
      to: "info@myurbanscoot.com",
      channel: "email",
      template: "contact-form", 
      data: {
        emailOptions: {
          replyTo: email,
          subject: `Nuevo mensaje de contacto: ${subject || 'Sin asunto'}`,
        },
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone || 'No proporcionado',
        contactSubject: subject || 'Sin asunto',
        contactMessage: message,
      },
    })

    console.log("✅ Email de contacto enviado exitosamente")

    res.status(200).json({
      message: "Mensaje enviado con éxito",
      success: true,
    })

  } catch (error) {
    console.error("❌ Error procesando mensaje de contacto:", error)

    // Errores de validación
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Datos inválidos",
        errors: error.errors,
        success: false,
      })
    }

    // Error general
    res.status(500).json({
      message: "Error interno del servidor",
      success: false,
    })
  }
}