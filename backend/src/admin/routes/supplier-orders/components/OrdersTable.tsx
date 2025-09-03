import React from "react";
import { Table, Badge, Text, Button } from "@medusajs/ui";
import {
  Eye,
  Edit,
  Check,
  Package,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { SupplierOrder } from "../types";

interface OrdersTableProps {
  orders: SupplierOrder[];
  onViewOrder: (order: SupplierOrder) => void;
  onEditOrder: (order: SupplierOrder) => void;
  onConfirmOrder: (orderId: string) => void;
  isConfirming?: boolean;
  getVisualStatus?: (order: SupplierOrder) => string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewOrder,
  onEditOrder,
  onConfirmOrder,
  isConfirming = false,
  getVisualStatus,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: "Borrador",
      pending: "Pendiente",
      confirmed: "Confirmado",
      shipped: "Enviado",
      partially_received: "Parcialmente recibido",
      received: "Recibido",
      incident: "Con Incidencia",
      cancelled: "Cancelado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      partially_received: "bg-orange-100 text-orange-800 border-orange-200",
      received: "bg-green-100 text-green-800 border-green-200",
      incident: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: <Clock className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      shipped: <Package className="w-4 h-4" />,
      partially_received: <Package className="w-4 h-4" />,
      received: <CheckCircle className="w-4 h-4" />,
      incident: <XCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />;
  };

  // Helper functions for transfer orders
  const isTransferOrder = (order: SupplierOrder): boolean => {
    return order.order_type === "transfer";
  };

  const getOrderTypeIcon = (order: SupplierOrder) => {
    return isTransferOrder(order) ? 
      <ArrowUpRight className="w-4 h-4 text-blue-600" /> :
      <Package className="w-4 h-4 text-gray-600" />;
  };

  const getOrderTypeLabel = (order: SupplierOrder): string => {
    return isTransferOrder(order) ? "Transferencia" : "Proveedor";
  };

  const getLocationDisplay = (order: SupplierOrder): string => {
    if (isTransferOrder(order)) {
      const from = order.source_location_name || "Origen";
      const to = order.destination_location_name || "Destino";
      return `${from} → ${to}`;
    }
    return order.destination_location_name || "Almacén principal";
  };

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Pedido</Table.HeaderCell>
          <Table.HeaderCell>Estado</Table.HeaderCell>
          <Table.HeaderCell>Tipo / Origen</Table.HeaderCell>
          <Table.HeaderCell>Total</Table.HeaderCell>
          <Table.HeaderCell>Fechas</Table.HeaderCell>
          <Table.HeaderCell>Progreso</Table.HeaderCell>
          <Table.HeaderCell>Acciones</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {orders.map((order) => (
          <Table.Row key={order.id}>
            <Table.Cell>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getOrderTypeIcon(order)}
                  <Text className="font-medium">{order.display_id}</Text>
                </div>
                {order.reference && (
                  <Text size="small" className="text-gray-500">Ref: {order.reference}</Text>
                )}
              </div>
            </Table.Cell>
            
            <Table.Cell>
              {(() => {
                const visualStatus = getVisualStatus ? getVisualStatus(order) : order.status;
                return (
                  <Badge className={getStatusColor(visualStatus)} size="small">
                    {getStatusIcon(visualStatus)}
                    {getStatusLabel(visualStatus)}
                  </Badge>
                );
              })()}
            </Table.Cell>
            
            <Table.Cell>
              <div className="space-y-1">
                {isTransferOrder(order) ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Badge size="small" className="bg-blue-100 text-blue-800 border-blue-200">
                        {getOrderTypeLabel(order)}
                      </Badge>
                    </div>
                    <Text size="small" className="text-gray-600">
                      {getLocationDisplay(order)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="font-medium">{order.supplier.name}</Text>
                    <Text size="small" className="text-gray-500">{order.supplier.legal_name}</Text>
                  </>
                )}
              </div>
            </Table.Cell>
            
            <Table.Cell>
              {isTransferOrder(order) ? (
                <div className="flex items-center gap-1 text-gray-500">
                  <ArrowUpRight className="w-4 h-4" />
                  <Text size="small">Transferencia</Text>
                </div>
              ) : (
                <Text className="font-semibold">{formatCurrency(order.total, order.currency_code)}</Text>
              )}
            </Table.Cell>
            
            <Table.Cell>
              <div className="space-y-1">
                <Text size="small">📅 {formatDate(order.order_date)}</Text>
                {order.expected_delivery_date && (
                  <Text size="small" className="text-gray-500">🚚 {formatDate(order.expected_delivery_date)}</Text>
                )}
              </div>
            </Table.Cell>
            
            <Table.Cell>
              {order.status === "received" ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <Text size="small" className="text-green-600">Completado</Text>
                </div>
              ) : order.status === "cancelled" ? (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <Text size="small" className="text-red-600">Cancelado</Text>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <Text size="small" className="text-yellow-600">En proceso</Text>
                </div>
              )}
            </Table.Cell>
            
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onViewOrder(order)}
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </Button>
                
                {(order.status === "pending" || order.status === "draft") && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onEditOrder(order)}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                )}
                
                {(order.status === "pending" || order.status === "draft") && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onConfirmOrder(order.id)}
                    disabled={isConfirming}
                  >
                    <Check className="w-4 h-4" />
                    Confirmar
                  </Button>
                )}
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};

export default OrdersTable;