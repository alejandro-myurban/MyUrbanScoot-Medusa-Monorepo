"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Badge } from "@medusajs/ui";

type Props = {
  chatData: any[];
  userId: string;
};

const OrderVisualization = ({ chatData, userId }: Props) => {
  const [orderData, setOrderData] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const lastOrderId = useMemo(() => {
    if (!chatData || chatData.length === 0) {
      return null;
    }

    const orderIdInAsterisk = /\*(\d{5})\*/; // 
    const orderIdPlain = /^(\d{5})$/; // 

    for (let i = chatData.length - 1; i >= 0; i--) {
      const message = chatData[i];
      
      if (message.user_id !== userId) {
        continue;
      }

      if (message.role === "assistant") {
        const messageText = message.message;
        const match = messageText.match(orderIdInAsterisk);
        if (match) {
          console.log(`🔍 [OrderVisualization] Pedido ${match[1]} encontrado en respuesta IA para ${userId}: "${messageText.substring(0, 100)}..."`);
          return match[1];
        }
      }
      
      if (message.role === "user") {
        const messageText = message.message.trim();
        const match = messageText.match(orderIdPlain);
        if (match) {
          const nextMessage = chatData[i + 1];
          if (nextMessage && 
              nextMessage.role === "assistant" && 
              nextMessage.user_id === userId) {
            console.log(`🔍 [OrderVisualization] Pedido ${match[1]} encontrado en consulta de usuario para ${userId}: "${messageText}"`);
            return match[1];
          }
        }
      }
    }
    
    console.log(`🔍 [OrderVisualization] No se encontró pedido para el usuario específico: ${userId}`);
    return null;
  }, [chatData, userId]);

  useEffect(() => {
    if (currentUserId !== userId) {
      console.log(`🔄 [OrderVisualization] Cambio de usuario: ${currentUserId} → ${userId}`);
      
      setOrderData(null);
      setCurrentUserId(userId);
      
      console.log(`🧹 [OrderVisualization] Estado limpiado para nuevo usuario: ${userId}`);
    }
  }, [userId, currentUserId]);

  useEffect(() => {
    if (currentUserId !== userId || !lastOrderId) {
      if (!lastOrderId) {
        console.log(`❌ [OrderVisualization] No hay pedido detectado para el usuario actual: ${userId}`);
        setOrderData(null);
      }
      return;
    }

    console.log(`📞 [OrderVisualization] Buscando datos del pedido ${lastOrderId} para usuario específico: ${userId}`);
    
    fetch(`/admin/order-by-id-wc?orderId=${lastOrderId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (currentUserId === userId) {
          if (data.order) {
            console.log(`✅ [OrderVisualization] Datos del pedido encontrados para ${userId}:`, data.order);
            setOrderData(data.order);
          } else {
            console.log(`❌ [OrderVisualization] No se encontraron datos válidos del pedido para ${userId}`);
            setOrderData(null);
          }
        }
      })
      .catch((error) => {
        console.error(`❌ [OrderVisualization] Error al buscar pedido para ${userId}:`, error);
        if (currentUserId === userId) {
          setOrderData(null);
        }
      });
  }, [lastOrderId, userId, currentUserId]);

  if (!orderData || currentUserId !== userId) {
    return null;
  }

  console.log(`✅ [OrderVisualization] Renderizando badge para usuario ${userId} - Pedido: ${orderData.display_id}`);
  
  return (
    <a
      href={`https://myurbanscoot.com/wp-admin/post.php?post=${orderData.id}&action=edit`}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-all duration-300 hover:scale-105"
    >
      <Badge
        color="blue"
        className="text-blue-600 border border-blue-600 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
      >
        Pedido #{orderData.display_id}: {orderData.status}
      </Badge>
    </a>
  );
};

export default OrderVisualization;