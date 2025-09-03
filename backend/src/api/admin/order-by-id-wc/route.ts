// src/api/admin/order-by-id/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ message: "orderId es un parámetro requerido." });
    }

    try {
        // Autenticación en base64 para la API de WooCommerce
        const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_KEY_S}`).toString("base64");
        
        // Realiza la petición GET a la API de WooCommerce para buscar por ID
        const response = await fetch(`${process.env.WC_URL}/orders/${orderId}`, {
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            // Maneja el error si la API de WooCommerce no encuentra el pedido
            const errorData = await response.json();
            console.error("Error de la API de WooCommerce:", errorData);
            if (response.status === 404) {
                return res.status(404).json({ message: "No se encontró el pedido con el ID proporcionado." });
            }
            return res.status(response.status).json({ message: "Error al consultar el pedido." });
        }

        const orderData = await response.json();

        const formattedOrder = {
            display_id: orderData.number,
            status: orderData.status,
            id: orderData.id,
        };

        return res.status(200).json({ order: formattedOrder });

    } catch (error) {
        console.error("Error al buscar la orden:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
}