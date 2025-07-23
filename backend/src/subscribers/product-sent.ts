import { Modules } from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";
import { sendWhatsAppMessage } from "../modules/whatsapp-notifications/twilio-whatsapp";

// 🌍 CONFIGURACIÓN DE IDIOMAS
const getLanguage = (countryCode: string): string => {
  const code = countryCode?.toLowerCase();
  
  if (['gb', 'us', 'ca', 'au'].includes(code)) return 'en';
  if (['fr', 'be'].includes(code)) return 'fr'; 
  if (['de', 'at', 'ch'].includes(code)) return 'de';
  if (['it'].includes(code)) return 'it';
  if (['pt', 'br'].includes(code)) return 'pt';
  if (['nl'].includes(code)) return 'nl';
  if (['pl'].includes(code)) return 'pl';
  
  return 'es'; // Default español
};

const getMessages = (lang: string) => {
  const messages = {
    en: {
      subject: "Your product has been shipped",
      greeting: "Hello! Your product is on its way.",
      preview: "Your order has been updated",
      whatsapp: {
        hello: "Hello",
        shipped: "Your order",
        hasBeenShipped: "has been shipped and is on its way.",
        products: "Products:",
        shippingTo: "Shipping to:",
        soon: "It will be with you soon! 🎉"
      }
    },
    fr: {
      subject: "Votre produit a été expédié",
      greeting: "Bonjour! Votre produit est en route.",
      preview: "Votre commande a été mise à jour",
      whatsapp: {
        hello: "Bonjour",
        shipped: "Votre commande",
        hasBeenShipped: "a été expédiée et est en route.",
        products: "Produits:",
        shippingTo: "Envoi à:",
        soon: "Il sera bientôt avec vous! 🎉"
      }
    },
    de: {
      subject: "Ihr Produkt wurde versandt",
      greeting: "Hallo! Ihr Produkt ist unterwegs.",
      preview: "Ihre Bestellung wurde aktualisiert",
      whatsapp: {
        hello: "Hallo",
        shipped: "Ihre Bestellung",
        hasBeenShipped: "wurde versandt und ist unterwegs.",
        products: "Produkte:",
        shippingTo: "Versand an:",
        soon: "Es wird bald bei Ihnen sein! 🎉"
      }
    },
    it: {
      subject: "Il tuo prodotto è stato spedito",
      greeting: "Ciao! Il tuo prodotto è in arrivo.",
      preview: "Il tuo ordine è stato aggiornato",
      whatsapp: {
        hello: "Ciao",
        shipped: "Il tuo ordine",
        hasBeenShipped: "è stato spedito ed è in arrivo.",
        products: "Prodotti:",
        shippingTo: "Spedizione a:",
        soon: "Sarà presto da te! 🎉"
      }
    },
    pt: {
      subject: "Seu produto foi enviado",
      greeting: "Olá! Seu produto está a caminho.",
      preview: "Seu pedido foi atualizado",
      whatsapp: {
        hello: "Olá",
        shipped: "Seu pedido",
        hasBeenShipped: "foi enviado e está a caminho.",
        products: "Produtos:",
        shippingTo: "Envio para:",
        soon: "Logo estará com você! 🎉"
      }
    },
    nl: {
      subject: "Uw product is verzonden",
      greeting: "Hallo! Uw product is onderweg.",
      preview: "Uw bestelling is bijgewerkt",
      whatsapp: {
        hello: "Hallo",
        shipped: "Uw bestelling",
        hasBeenShipped: "is verzonden en onderweg.",
        products: "Producten:",
        shippingTo: "Verzending naar:",
        soon: "Het zal binnenkort bij u zijn! 🎉"
      }
    },
    pl: {
      subject: "Twój produkt został wysłany",
      greeting: "Cześć! Twój produkt jest w drodze.",
      preview: "Twoje zamówienie zostało zaktualizowane",
      whatsapp: {
        hello: "Cześć",
        shipped: "Twoje zamówienie",
        hasBeenShipped: "zostało wysłane i jest w drodze.",
        products: "Produkty:",
        shippingTo: "Wysyłka do:",
        soon: "Wkrótce będzie u Ciebie! 🎉"
      }
    },
    es: {
      subject: "Tu producto ha sido enviado",
      greeting: "¡Hola! Tu producto ya está en camino.",
      preview: "Tu pedido ha sido actualizado",
      whatsapp: {
        hello: "¡Hola",
        shipped: "Tu pedido",
        hasBeenShipped: "ha sido enviado y está en camino.",
        products: "Productos:",
        shippingTo: "Se enviará a:",
        soon: "¡Pronto estará contigo! 🎉"
      }
    }
  };

  return messages[lang] || messages.es;
};

export default async function orderDeliveredHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log("🚀 Subscriber unificado activado para orden entregada");
  console.log("📦 Event data:", JSON.stringify(data, null, 2));

  // Resolver servicios necesarios
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );
  const eventBusService = container.resolve(Modules.EVENT_BUS);

  try {
    // Obtener la orden con todas las relaciones necesarias
    console.log("🔍 Obteniendo orden con relaciones...");
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "summary", "shipping_address"],
    });

    console.log("📦 Orden completa:", JSON.stringify(order, null, 2));

    // Trigger del evento MeiliSearch
    await eventBusService.emit({
      name: "meilisearch.sync",
      data: "",
    });
    console.log("🔍 MeiliSearch sync event triggered");

    // 🌍 DETECCIÓN DE IDIOMA
    const lang = getLanguage(order.shipping_address?.country_code || 'es');
    const messages = getMessages(lang);
    
    // 📧 ENVÍO DE EMAIL
    console.log(`📧 Enviando notificación por email en ${lang.toUpperCase()}...`);
    try {
      // Obtener template según idioma (fallback a español si no existe)
      const templateKey = `PRODUCT_DELIVERED${lang === 'es' ? '' : '_' + lang.toUpperCase()}`;
      const template = EmailTemplates[templateKey] || EmailTemplates.PRODUCT_DELIVERED;
      
      await notificationModuleService.createNotifications({
        to: order.email,
        channel: "email",
        template: template,
        data: {
          emailOptions: {
            replyTo: "info@myurbanscoot.com",
            subject: messages.subject,
          },
          greeting: messages.greeting,
          actionUrl: "https://misitio.com/orden/detalle",
          preview: messages.preview,
        },
      });
      console.log("✅ Email enviado exitosamente");
    } catch (emailError) {
      console.error("❌ Error enviando email:", emailError);
    }

    // 📱 ENVÍO DE WHATSAPP
    console.log("📱 Preparando notificación por WhatsApp...");
    
    // Extraer teléfono
    const phone = order.shipping_address?.phone?.trim();
    console.log("📱 Teléfono extraído:", phone);

    if (!phone?.startsWith("+")) {
      console.warn("⚠️ Número de teléfono inválido o faltante:", phone);
    } else {
      try {
        // Obtener nombre del customer
        let customerName = order.shipping_address?.first_name || "";

        // Si hay customer_id, intentar obtener más información
        if (order.customer_id) {
          console.log("👤 Customer ID encontrado:", order.customer_id);
          try {
            const customerModuleService = container.resolve(Modules.CUSTOMER);
            const customer = await customerModuleService.retrieveCustomer(
              order.customer_id
            );
            customerName = customer.first_name || customer.email || customerName;
          } catch (customerError) {
            console.warn("⚠️ Error obteniendo customer:", customerError.message);
          }
        }

        // Crear mensaje para WhatsApp
        const whatsappMessage = `
🚚 ${messages.whatsapp.hello} ${customerName}! ${messages.whatsapp.shipped} #${order.display_id} ${messages.whatsapp.hasBeenShipped}

📦 ${messages.whatsapp.products}
${order.items.map((item) => `• ${item.title} x${item.quantity}`).join("\n")}

📍 ${messages.whatsapp.shippingTo} ${order.shipping_address?.address_1}, ${order.shipping_address?.city}

${messages.whatsapp.soon}
        `.trim();

        console.log(`💬 Mensaje WhatsApp a enviar en ${lang.toUpperCase()}:`, whatsappMessage);
        console.log("📱 Enviando a:", phone);

        await sendWhatsAppMessage(phone, whatsappMessage);
        console.log("✅ WhatsApp enviado exitosamente");
      } catch (whatsappError) {
        console.error("❌ Error enviando WhatsApp:", whatsappError);
      }
    }

    console.log("🎉 Subscriber unificado completado exitosamente");
  } catch (error) {
    console.error("❌ Error general en subscriber:", error);
    console.error("📄 Stack trace:", error.stack);
  }
}

export const config: SubscriberConfig = {
  event: "order.status_delivered",
};