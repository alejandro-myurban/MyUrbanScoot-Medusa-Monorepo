// src/subscribers/whatsapp-order-placed.ts
import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { sendWhatsAppMessage } from "../modules/whatsapp-notifications/twilio-whatsapp"

export default async function whatsappOrderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log("🔥 Subscriber WhatsApp activado")

  const orderModuleService = container.resolve(Modules.ORDER)
  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "summary", "shipping_address", "customer"],
  })

  const phone = order.shipping_address?.phone?.trim()
  if (!phone?.startsWith("+")) {
    console.warn("⚠️ Número inválido:", phone)
    return
  }

  const message = `
¡Hola ${order.shipping_address.first_name || ""}! Tu pedido #${order.display_id} fue confirmado.

📦 Productos:
${order.items.map(i => `• ${i.title} x${i.quantity}`).join("\n")}

💰 Total: $${(order.total)}
Ver detalles en: https://tutienda.com/orden/${order.id}`

  await sendWhatsAppMessage(phone, message)
}

export const config: SubscriberConfig = {
  event: "order.placed"
}
