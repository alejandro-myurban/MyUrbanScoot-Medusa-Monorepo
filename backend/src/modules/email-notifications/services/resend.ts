// src/services/resend-notification.ts
import { Logger, NotificationTypes } from '@medusajs/framework/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import { Resend, CreateEmailOptions } from 'resend'
import { ReactNode } from 'react'
import { generateEmailTemplate } from '../templates'
import { sendWhatsAppMessage } from '../../whatsapp-notifications/twilio-whatsapp'
import { generateWhatsAppTemplate, WhatsAppTemplateData } from '../../whatsapp-notifications/templates' // Importa el nuevo generador de templates de WhatsApp

type InjectedDependencies = { logger: Logger }
interface ResendServiceConfig { apiKey: string; from: string }

export interface ResendNotificationServiceOptions {
  api_key: string
  from: string
}

type NotificationEmailOptions = Omit<CreateEmailOptions, 'to' | 'from' | 'react' | 'html' | 'attachments'>

export class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "RESEND_NOTIFICATION_SERVICE"
  protected config_: ResendServiceConfig
  protected logger_: Logger
  protected resend: Resend

  constructor({ logger }: InjectedDependencies, options: ResendNotificationServiceOptions) {
    super()
    this.config_ = { apiKey: options.api_key, from: options.from }
    this.logger_ = logger
    this.resend = new Resend(this.config_.apiKey)
  }

  async send(notification: NotificationTypes.ProviderSendNotificationDTO) {
    if (!notification) throw new MedusaError(MedusaError.Types.INVALID_DATA, `No notification provided`)
    if (notification.channel === 'sms') throw new MedusaError(MedusaError.Types.INVALID_DATA, `SMS not supported`)

    // 1. Generar contenido email
    let emailContent: ReactNode
    try {
      emailContent = generateEmailTemplate(notification.template, notification.data)
    } catch (error) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Error en template de email ${notification.template}`)
    }

    const emailOptions = notification.data.emailOptions as NotificationEmailOptions
    const message: CreateEmailOptions = {
      to: notification.to,
      from: notification.from?.trim() ?? this.config_.from,
      react: emailContent,
      subject: emailOptions.subject ?? 'Notificación',
      headers: emailOptions.headers,
      replyTo: emailOptions.replyTo,
      cc: emailOptions.cc,
      bcc: emailOptions.bcc,
      tags: emailOptions.tags,
      text: emailOptions.text,
      attachments: Array.isArray(notification.attachments)
        ? notification.attachments.map((att) => ({
            content: att.content,
            filename: att.filename,
            content_type: att.content_type,
            disposition: att.disposition ?? 'attachment',
            id: att.id ?? undefined
          }))
        : undefined,
      scheduledAt: emailOptions.scheduledAt
    }

    // 2. Enviar email
    await this.resend.emails.send(message)
    this.logger_.log(`📧 Email enviado a ${notification.to}`)

    // 3. Enviar WhatsApp si hay número y template especificado
    if (typeof notification.data.whatsapp === "string" && notification.data.whatsappTemplate) {
      try {
        // Asegúrate de que notification.data.whatsappTemplate y notification.data.whatsappData
        // coincidan con la estructura esperada por WhatsAppTemplateData
        const whatsappTemplateType = notification.data.whatsappTemplate as WhatsAppTemplateData["type"];
        const whatsappTemplateSpecificData = notification.data.whatsappData as WhatsAppTemplateData["data"];

        const whatsappMsg = generateWhatsAppTemplate(whatsappTemplateType, whatsappTemplateSpecificData);
        await sendWhatsAppMessage(notification.data.whatsapp, whatsappMsg);
        this.logger_.log(`💬 WhatsApp enviado a ${notification.data.whatsapp}`);
      } catch (error: any) {
        this.logger_.error(`❌ Error al generar o enviar WhatsApp: ${error.message}`);
        // Puedes decidir si quieres lanzar un error aquí o simplemente loggearlo
      }
    }

    return {}
  }
}