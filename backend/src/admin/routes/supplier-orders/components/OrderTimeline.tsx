import React from "react";
import { Text } from "@medusajs/ui";
import { Clock, CheckCircle, Truck, Package } from "lucide-react";
import { SupplierOrder } from "../types";

interface OrderTimelineProps {
  order: SupplierOrder;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timelineSteps = [
    {
      key: 'created',
      label: 'Creado',
      icon: <Clock className="w-4 h-4" />,
      completed: !!order.created_at,
      date: order.created_at,
    },
    {
      key: 'confirmed',
      label: 'Confirmado',
      icon: <CheckCircle className="w-4 h-4" />,
      completed: !!order.confirmed_at,
      date: order.confirmed_at,
    },
    {
      key: 'shipped',
      label: 'Enviado',
      icon: <Truck className="w-4 h-4" />,
      completed: !!order.shipped_at,
      date: order.shipped_at,
    },
    {
      key: 'received',
      label: 'Recibido',
      icon: <Package className="w-4 h-4" />,
      completed: !!order.received_at,
      date: order.received_at,
    },
  ];

  return (
    <div className="flex items-center gap-8 overflow-x-auto py-4">
      {timelineSteps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className={`flex flex-col items-center gap-2 ${
            step.completed ? "text-blue-600" : "text-gray-400"
          }`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step.completed ? "border-blue-600 bg-blue-50" : "border-gray-300"
            }`}>
              {step.icon}
            </div>
            <Text size="small">{step.label}</Text>
            {step.date && (
              <Text size="small" className="text-gray-500">
                {formatDateTime(step.date)}
              </Text>
            )}
          </div>
          
          {index < timelineSteps.length - 1 && (
            <div className="flex-1 border-t-2 border-gray-300 min-w-[50px]"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default OrderTimeline;