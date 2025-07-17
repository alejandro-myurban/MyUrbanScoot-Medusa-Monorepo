// src/subscribers/whatsapp-order-placed.ts
import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { sendWhatsAppMessage } from "../modules/whatsapp-notifications/twilio-whatsapp";

export default async function sendNotificationOnOrder({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log("🔥 Subscriber WhatsApp activado");
  console.log("📦 Event data:", JSON.stringify(data, null, 2));

  try {
    const orderModuleService = container.resolve(Modules.ORDER);

    // Primero obtenemos la orden sin relaciones para ver qué tiene
    console.log("🔍 Obteniendo orden básica...");
    const basicOrder = await orderModuleService.retrieveOrder(data.id);
    console.log("📋 Orden básica:", JSON.stringify(basicOrder, null, 2));

    // Intentamos con diferentes relaciones disponibles en Medusa v2
    console.log("🔍 Obteniendo orden con relaciones...");
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "summary", "shipping_address"],
    });
    console.log("📦 Orden completa:", JSON.stringify(order, null, 2));

    // Log para ver qué propiedades tiene la shipping_address
    console.log(
      "📍 Shipping address:",
      JSON.stringify(order.shipping_address, null, 2)
    );

    const phone = order.shipping_address?.phone?.trim();
    console.log("📱 Teléfono extraído:", phone);

    if (!phone?.startsWith("+")) {
      console.warn("⚠️ Número inválido:", phone);
      return;
    }

    // Para obtener información del customer, necesitamos usar el Customer Module
    let customerName = order.shipping_address?.first_name || "";

    // Si hay customer_id en la orden, intentamos obtener el customer
    if (order.customer_id) {
      console.log("👤 Customer ID encontrado:", order.customer_id);
      try {
        const customerModuleService = container.resolve(Modules.CUSTOMER);
        const customer = await customerModuleService.retrieveCustomer(
          order.customer_id
        );
        console.log("👤 Customer data:", JSON.stringify(customer, null, 2));
        customerName = customer.first_name || customer.email || customerName;
      } catch (customerError) {
        console.warn("⚠️ Error obteniendo customer:", customerError.message);
      }
    }

    const message = `
      ¡Hola ${customerName}! Tu pedido #${order.display_id} fue confirmado.

    📦 Productos:
      ${order.items.map((i) => `• ${i.title} x${i.quantity}`).join("\n")}


    console.log("💬 Mensaje a enviar:", message);
    console.log("📱 Enviando a:", phone);

    await sendWhatsAppMessage(phone, message);
    console.log("✅ Mensaje de WhatsApp enviado exitosamente");
  } catch (error) {
    console.error("❌ Error en subscriber WhatsApp:", error);
    console.error("📄 Stack trace:", error.stack);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
