// src/whatsapp-templates/product-status.ts

/**
 * Identificador único para el template de actualización de estado de producto en WhatsApp.
 */
export const WHATSAPP_PRODUCT_STATUS = "whatsapp-product-status-update";

/**
 * Interfaz para los datos necesarios para el template de WhatsApp de actualización de estado de producto.
 * Mantiene la información concisa para un mensaje de WhatsApp.
 */
export interface ProductStatusWhatsApp {
  customer_name: string;
  order_id: string;
  status_display: string;
  // Puedes añadir más campos si son estrictamente necesarios para el mensaje de WhatsApp resumido
}

/**
 * Genera el mensaje de WhatsApp para una actualización de estado de producto.
 * @param data Los datos para el template de WhatsApp de ProductStatus.
 * @returns El mensaje de WhatsApp formateado.
 */
export const generateProductStatusWhatsAppMessage = (
  data: ProductStatusWhatsApp
): string => {
  const { customer_name, order_id, status_display } = data;
  return `¡Hola ${customer_name}! Tu pedido #${order_id} ha sido actualizado a: ${status_display}. ¡Gracias por tu paciencia!`;
};
