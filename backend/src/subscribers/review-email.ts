import { Modules } from "@medusajs/framework/utils"
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { EmailTemplates } from "../modules/email-notifications/templates"

export default async function reviewRequestHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  const orderModuleService = container.resolve<IOrderModuleService>(Modules.ORDER)

  // Recuperamos la orden con su información necesaria
  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "shipping_address"],
  })

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: EmailTemplates.PRODUCT_DELIVERED,
      data: {
        emailOptions: {
          replyTo: "info@myurbanscoot.com",
          subject: "¡Cuéntanos cómo fue tu compra!",
        },
        greeting: `¡Hola ${order.shipping_address?.first_name || ''}! Esperamos que ya hayas recibido tu pedido.`,  
        actionUrl: `${process.env.STORE_CORS}/es/reviews/${order.id}`,
        preview: "Tu opinión es muy importante para nosotros",
      },
    })
  } catch (err) {
    console.error("Error enviando solicitud de reseña:", err)
  }
}

export const config: SubscriberConfig = {
  event: ["order.check_orders_1day", "order.placed"]
}
