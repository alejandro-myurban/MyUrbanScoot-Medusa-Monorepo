import { MedusaError } from '@medusajs/framework/utils'
import twilio from 'twilio'

export const sendWhatsAppMessage = async (to: string, message: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_NUMBER

  if (!accountSid || !authToken || !from) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Twilio credentials missing"
    )
  }

  const client = twilio(accountSid, authToken)

  try {
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
    })
    console.log('✅ WhatsApp enviado:', response.sid)
  } catch (error: any) {
    console.error('❌ Error al enviar WhatsApp:', error)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `No se pudo enviar WhatsApp a ${to}: ${error.message}`
    )
  }
}
