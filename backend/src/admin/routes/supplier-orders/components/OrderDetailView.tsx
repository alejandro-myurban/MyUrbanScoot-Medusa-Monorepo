import React from "react";
import { Container, Heading, Button, Text, Badge, Table } from "@medusajs/ui";
import { 
  Package, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  Plus 
} from "lucide-react";
import { SupplierOrder, SupplierOrderLine } from "../types";
import OrderTimeline from "./OrderTimeline";

interface OrderDetailViewProps {
  order: SupplierOrder;
  orderLines: SupplierOrderLine[];
  isLoadingLines: boolean;
  validStatuses?: { validNextStatuses: string[] };
  updateStatusMutation: {
    mutate: (data: { orderId: string; status: string }) => void;
    isPending: boolean;
  };
  onBack: () => void;
  onReceiveItems: (line: SupplierOrderLine) => void;
  onCompleteReceive: (line: SupplierOrderLine) => void;
  onIncidentModal: (line: SupplierOrderLine) => void;
  updateLineIncidentMutation: {
    isPending: boolean;
  };
  receiveLineMutation: {
    isPending: boolean;
  };
  getVisualStatus?: (order: SupplierOrder) => string;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  orderLines,
  isLoadingLines,
  validStatuses,
  updateStatusMutation,
  onBack,
  onReceiveItems,
  onCompleteReceive,
  onIncidentModal,
  updateLineIncidentMutation,
  receiveLineMutation,
  getVisualStatus,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      draft: <Package className="w-4 h-4" />,
      pending: <Package className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      shipped: <Package className="w-4 h-4" />,
      partially_received: <Package className="w-4 h-4" />,
      received: <CheckCircle className="w-4 h-4" />,
      incident: <AlertTriangle className="w-4 h-4" />,
      cancelled: <Package className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || <Package className="w-4 h-4" />;
  };

  const getLineStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      partial: "bg-orange-100 text-orange-800 border-orange-200",
      received: "bg-green-100 text-green-800 border-green-200",
      incident: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getValidStatusOptions = (currentStatus: string, validNextStatuses?: string[]) => {
    const statusLabels: Record<string, string> = {
      draft: 'Borrador',
      pending: 'Pendiente', 
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      partially_received: 'Parcialmente recibido',
      received: 'Recibido',
      incident: 'Con incidencia',
      cancelled: 'Cancelado'
    };

    const options = [{
      value: currentStatus,
      label: `${statusLabels[currentStatus] || currentStatus} (actual)`,
      disabled: true
    }];

    // Solo permitir cambiar a confirmado, independientemente de validNextStatuses
    if (currentStatus !== 'confirmed') {
      options.push({
        value: 'confirmed',
        label: statusLabels['confirmed'],
        disabled: false
      });
    }

    return options;
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="small" onClick={onBack}>
            ← Volver
          </Button>
          <Heading level="h2">Pedido {order.display_id}</Heading>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            // Create a temp order with lines for visual status calculation
            const orderWithLines = { ...order, order_lines: orderLines };
            const visualStatus = getVisualStatus ? getVisualStatus(orderWithLines) : order.status;
            return (
              <Badge className={getStatusColor(visualStatus)} size="small">
                {getStatusIcon(visualStatus)}
                {getStatusLabel(visualStatus)}
              </Badge>
            );
          })()}
          
          {validStatuses && validStatuses.validNextStatuses && validStatuses.validNextStatuses.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  updateStatusMutation.mutate({ orderId: order.id, status: e.target.value });
                }
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
              disabled={updateStatusMutation.isPending}
            >
              <option value="">Cambiar estado...</option>
            
              {getValidStatusOptions(order.status, validStatuses.validNextStatuses).map((option) => (
                <option 
                  key={option.value} 
                  value={option.disabled ? "" : option.value}
                  disabled={option.disabled}
                  style={{ color: option.disabled ? '#999' : 'inherit' }}
                >
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Información del Pedido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Información del Pedido</Heading>
            <div className="space-y-3">
              <div>
                <Text size="small" className="text-gray-600">Proveedor</Text>
                <Text className="font-medium">{order.supplier.name}</Text>
                <Text size="small" className="text-gray-500">{order.supplier.legal_name}</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600">Referencia Externa</Text>
                <Text className="font-medium">{order.reference || "-"}</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600">Fecha de Pedido</Text>
                <Text className="font-medium">{formatDate(order.order_date)}</Text>
              </div>
              {order.expected_delivery_date && (
                <div>
                  <Text size="small" className="text-gray-600">Entrega Esperada</Text>
                  <Text className="font-medium">{formatDate(order.expected_delivery_date)}</Text>
                </div>
              )}
              <div>
                <Text size="small" className="text-gray-600">Realizado por</Text>
                <Text className="font-medium">{order.created_by || "No especificado"}</Text>
              </div>
              {order.received_by && (
                <div>
                  <Text size="small" className="text-gray-600">Recepcionado por</Text>
                  <Text className="font-medium">{order.received_by}</Text>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Totales</Heading>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text>Subtotal:</Text>
                <Text className="font-medium">{formatCurrency(order.subtotal, order.currency_code)}</Text>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between">
                  <Text>Descuentos:</Text>
                  <Text className="font-medium text-green-600">-{formatCurrency(order.discount_total, order.currency_code)}</Text>
                </div>
              )}
              {order.tax_total > 0 && (
                <div className="flex justify-between">
                  <Text>Impuestos:</Text>
                  <Text className="font-medium">{formatCurrency(order.tax_total, order.currency_code)}</Text>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <Text>Total:</Text>
                <Text>{formatCurrency(order.total, order.currency_code)}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline del Pedido */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">Estado del Pedido</Heading>
          <OrderTimeline order={order} />
        </div>

        {/* Líneas del Pedido */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">Líneas del Pedido</Heading>
          
          {isLoadingLines ? (
            <Text>Cargando líneas...</Text>
          ) : orderLines.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Producto</Table.HeaderCell>
                  <Table.HeaderCell>Pedido</Table.HeaderCell>
                  <Table.HeaderCell>Recibido</Table.HeaderCell>
                  <Table.HeaderCell>Pendiente</Table.HeaderCell>
                  <Table.HeaderCell>Precio Unit.</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Estado</Table.HeaderCell>
                  <Table.HeaderCell>Acciones</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orderLines.map((line) => {
                  return (
                    <Table.Row key={line.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                            {line.product_thumbnail ? (
                              <img 
                                className="w-full h-full object-cover rounded-xl" 
                                src={line.product_thumbnail} 
                                alt={line.product_title}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${line.product_thumbnail ? 'hidden' : 'flex'}`}>
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <Text className="font-medium">{line.product_title}</Text>
                            {line.supplier_sku && (
                              <Text size="small" className="text-gray-500">SKU: {line.supplier_sku}</Text>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="font-medium">{line.quantity_ordered}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="font-medium text-green-600">{line.quantity_received}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        {(() => {
                          const pendingQty = line.quantity_pending || (line.quantity_ordered - line.quantity_received);
                          return (
                            <Text className={`font-medium ${pendingQty > 0 ? "text-orange-600" : "text-gray-500"}`}>
                              {pendingQty}
                            </Text>
                          );
                        })()}
                      </Table.Cell>
                      <Table.Cell>
                        <Text>{formatCurrency(line.unit_price, order.currency_code)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="font-medium">{formatCurrency(line.total_price, order.currency_code)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Badge className={getLineStatusColor(line.line_status)} size="small">
                            {line.line_status === "incident" && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {line.line_status === "pending" ? "Pendiente" : 
                             line.line_status === "partial" ? "Parcial" :
                             line.line_status === "incident" ? "Incidencia" :
                             line.line_status === "cancelled" ? "Cancelado" : "Completo"}
                          </Badge>
                        </div>
                        
                        {line.line_status === "incident" && line.reception_notes && (
                          <div className="mt-1">
                            <Text size="small" className="text-red-600">
                              ⚠️ {line.reception_notes}
                            </Text>
                          </div>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-col gap-2 py-2">
                          {/* Botones de acción según estado de línea */}
                          {order.status !== "cancelled" && (
                            <>
                              {/* Marcar como incidencia */}
                              <Button
                                variant={line.line_status === "incident" ? "primary" : "secondary"}
                                size="small"
                                onClick={() => onIncidentModal(line)}
                                disabled={updateLineIncidentMutation.isPending}
                                className="text-xs"
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {line.line_status === "incident" ? "Quitar incidencia" : "Marcar incidencia"}
                              </Button>

                              {/* Recepción completa */}
                              {(() => {
                                const pendingQty = line.quantity_pending || (line.quantity_ordered - line.quantity_received);
                                return pendingQty > 0;
                              })() && (
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => onCompleteReceive(line)}
                                  disabled={receiveLineMutation.isPending}
                                  className="text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Recepcionar todo
                                </Button>
                              )}

                              {/* Recepción parcial */}
                              {(() => {
                                const pendingQty = line.quantity_pending || (line.quantity_ordered - line.quantity_received);
                                return pendingQty > 0;
                              })() && (
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => onReceiveItems(line)}
                                  disabled={receiveLineMutation.isPending}
                                  className="text-xs"
                                >
                                  <Package className="w-3 h-3 mr-1" />
                                  Recepción parcial
                                </Button>
                              )}
                            </>
                          )}
                          
                          {/* Información de recepción */}
                          {line.received_at && (
                            <div className="mt-1">
                              <Text size="small" className="text-gray-500">
                                Recibido: {formatDateTime(line.received_at)}
                              </Text>
                              {line.received_by && (
                                <Text size="small" className="text-gray-500">
                                  Por: {line.received_by}
                                </Text>
                              )}
                              {line.reception_notes && (
                                <Text size="small" className="text-gray-400">
                                  {line.reception_notes}
                                </Text>
                              )}
                            </div>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <Text className="text-gray-500">No hay líneas en este pedido</Text>
              {order.status === "draft" && (
                <Button variant="secondary" size="small" className="mt-2" onClick={() => console.log("Add first order line")}>
                  <Plus className="w-4 h-4" />
                  Agregar primera línea
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default OrderDetailView;