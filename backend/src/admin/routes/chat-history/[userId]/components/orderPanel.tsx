// src/admin/widgets/chat-panel/components/OrderPanel.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Badge, Text, Heading, Button } from "@medusajs/ui";
import { X, ExternalLink, Phone } from "lucide-react";
import { sdk } from "../../../../lib/sdk";
import FinancingVisualization from "../components/financingVisualization"; // ← Importar el componente

type Order = {
    id: number;
    number: string;
    status: string;
    billing: {
        phone: string;
    }
};

type Props = {
    phoneNumber: string;
    isOpen: boolean;
    onClose: () => void;
    userId: string; // ← Nueva prop
};

const OrderPanel = ({ phoneNumber, isOpen, onClose, userId }: Props) => {
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const handleFinancingClick = () => {
     onClose();
    };

    useEffect(() => {
        if (!phoneNumber || !isOpen) {
            setOrders(null);
            return;
        }

        const fetchOrders = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await sdk.client.fetch<{ orders?: Order[] }>(
                    `/admin/order-by-phone?phoneNumber=${encodeURIComponent(phoneNumber)}`,
                    { method: "GET" }
                );

                console.log("Response from API:", response);

                if (response && response.orders) {
                    setOrders(response.orders);
                } else {
                    setOrders([]);
                    setError("No se encontraron pedidos o formato inesperado");
                }
            } catch (err: any) {
                console.error("❌ Error al buscar pedidos:", err);
                
                if (err.status === 404) {
                    setError("Endpoint no encontrado. Verifica que la ruta /admin/order-by-phone exista.");
                } else if (err.status === 401 || err.status === 403) {
                    setError("Error de autenticación con WooCommerce.");
                } else {
                    setError("Error al cargar los pedidos. Verifica la conexión.");
                }
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [phoneNumber, isOpen]);

    const panelClasses = `fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 p-6 flex flex-col space-y-4 dark:bg-gray-800 dark:text-white ${
        isOpen ? "translate-x-0" : "translate-x-full"
    }`;

    return (
        <div className={panelClasses}>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <Heading level="h3">Pedidos por Teléfono</Heading>
                <Button onClick={onClose} variant="transparent" size="small">
                    <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
                </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                <Text>Teléfono: <strong>{phoneNumber}</strong></Text>
            </div>

            {/* Agregar FinancingVisualization aquí */}
            <FinancingVisualization 
                userId={userId} 
                onBadgeClick={handleFinancingClick}
            />


            {isLoading && <Text>Cargando pedidos...</Text>}
            {error && <Text className="text-red-500">{error}</Text>}
            
            {!isLoading && !error && (!orders || orders.length === 0) && (
                <Text>No se encontraron pedidos para este número.</Text>
            )}

            {!isLoading && orders && orders.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {orders.map((order) => (
                        <div key={order.id} className="p-3 border rounded-md shadow-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex justify-between items-center mb-1">
                                <Text className="font-semibold">Pedido #{order.number}</Text>
                                <a
                                    href={`https://myurbanscoot.com/wp-admin/post.php?post=${order.id}&action=edit`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <Badge color="blue">{order.status}</Badge>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
    );
};

export default OrderPanel;