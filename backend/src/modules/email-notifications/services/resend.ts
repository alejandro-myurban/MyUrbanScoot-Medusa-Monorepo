// src/services/resend-notification.ts
import { Logger, NotificationTypes } from '@medusajs/framework/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import { Resend, CreateEmailOptions } from 'resend'
import { ReactNode } from 'react'
import { generateEmailTemplate } from '../templates'
import { sendWhatsAppMessage } from '../../whatsapp-notifications/twilio-whatsapp'

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
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Error en template ${notification.template}`)
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

    // 3. Enviar WhatsApp si hay número
    if (typeof notification.data.whatsapp === "string") {
      const nombre = notification.data.customerName || "cliente"
      const whatsappMsg = `¡Gracias por tu compra, ${nombre}! Tu pedido está siendo procesado.`
      await sendWhatsAppMessage(notification.data.whatsapp, whatsappMsg)
    }

    return {}
  }
}
