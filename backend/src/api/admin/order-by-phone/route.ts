// src/api/admin/order-by-phone/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { phoneNumber } = req.query as any

    if (!phoneNumber) {
        return res.status(400).json({ message: "phoneNumber es un parámetro requerido." });
    }

    try {
        const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_KEY_S}`).toString("base64");
        
        console.log("🔍 Buscando órdenes para teléfono:", phoneNumber);
        console.log("URL base:", `${process.env.WC_URL}/orders`);

        // CORREGIDO: Usar solo /orders ya que WC_URL ya incluye la ruta base
        const response = await fetch(`${process.env.WC_URL}/orders?search=${encodeURIComponent(phoneNumber)}`, {
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Status de respuesta:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Error de la API de WooCommerce:", errorData);
            return res.status(response.status).json({ 
                message: "Error al consultar las órdenes.",
                details: errorData 
            });
        }

        const ordersData = await response.json();
        console.log("Órdenes encontradas:", ordersData.length);

        // Filtrar órdenes que realmente tengan este teléfono en billing
        const filteredOrders = ordersData.filter((order: any) => 
            order.billing?.phone?.includes(phoneNumber) ||
            order.billing?.phone?.replace(/\D/g, '').includes(phoneNumber.replace(/\D/g, ''))
        );

        console.log("Órdenes filtradas:", filteredOrders.length);

        // Formatear las órdenes
        const formattedOrders = filteredOrders.map((order: any) => ({
            id: order.id,
            number: order.number || order.id.toString(),
            status: order.status,
            billing: {
                phone: order.billing?.phone || ""
            }
        }));

        return res.status(200).json({ orders: formattedOrders });

    } catch (error) {
        console.error("❌ Error al buscar órdenes por teléfono:", error);
        return res.status(500).json({ 
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        });
    }
}