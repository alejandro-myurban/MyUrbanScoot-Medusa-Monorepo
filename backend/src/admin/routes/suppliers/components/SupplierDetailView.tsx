import React from "react";
import { Container, Heading, Badge, Text, Button, Table } from "@medusajs/ui";
import { Edit, Plus } from "lucide-react";
import { Supplier, SupplierOrder } from "../types";

interface SupplierDetailViewProps {
  supplier: Supplier;
  orders: SupplierOrder[];
  isLoadingOrders: boolean;
  onBack: () => void;
  onEdit: (supplier: Supplier) => void;
}

export const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({
  supplier,
  orders,
  isLoadingOrders,
  onBack,
  onEdit,
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
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="small"
            onClick={onBack}
          >
            ← Volver
          </Button>
          <Heading level="h2">Detalles del Proveedor</Heading>
        </div>
        <div className="flex items-center gap-2">
          <Badge size="small" className={supplier.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {supplier.is_active ? "Activo" : "Inactivo"}
          </Badge>
          <Button variant="secondary" size="small" onClick={() => onEdit(supplier)}>
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Información del Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Información General</Heading>
            <div className="space-y-3">
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Nombre Comercial</Text>
                <Text className="font-medium">{supplier.name}</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Razón Social</Text>
                <Text className="font-medium">{supplier.legal_name}</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">NIF/CIF</Text>
                <Text className="font-medium">{supplier.tax_id}</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Email</Text>
                <Text className="font-medium">{supplier.email}</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Teléfono</Text>
                <Text className="font-medium">{supplier.phone}</Text>
              </div>
              {supplier.website && (
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">Website</Text>
                  <a href={supplier.website} target="_blank" className="font-medium text-blue-600 hover:underline">
                    {supplier.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Dirección</Heading>
            <div className="space-y-3">
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Dirección</Text>
                <Text className="font-medium">{supplier.address_line_1}</Text>
                {supplier.address_line_2 && (
                  <Text className="text-gray-500">{supplier.address_line_2}</Text>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">CP</Text>
                  <Text className="font-medium">{supplier.postal_code}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">Ciudad</Text>
                  <Text className="font-medium">{supplier.city}</Text>
                </div>
              </div>
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Provincia</Text>
                <Text className="font-medium">{supplier.province}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Condiciones Comerciales */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">Condiciones Comerciales</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Text size="small" className="text-gray-600 dark:text-gray-400">Condiciones de Pago</Text>
              <Text className="font-medium">{supplier.payment_terms} días</Text>
            </div>
            <div>
              <Text size="small" className="text-gray-600 dark:text-gray-400">Moneda</Text>
              <Text className="font-medium">{supplier.currency_code}</Text>
            </div>
            <div>
              <Text size="small" className="text-gray-600 dark:text-gray-400">Descuento General</Text>
              <Text className="font-medium">{supplier.discount_percentage}%</Text>
            </div>
          </div>
        </div>

        {/* Pedidos Recientes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Heading level="h3" className="text-lg">Pedidos Recientes</Heading>
            <Button variant="secondary" size="small">
              <Plus className="w-4 h-4" />
              Nuevo Pedido
            </Button>
          </div>
          
          {isLoadingOrders ? (
            <Text>Cargando pedidos...</Text>
          ) : orders.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Pedido</Table.HeaderCell>
                  <Table.HeaderCell>Estado</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Entrega</Table.HeaderCell>
                  <Table.HeaderCell>Fecha</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.slice(0, 5).map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>
                      <Text className="font-medium">{order.display_id}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge className={getStatusColor(order.status)} size="small">
                        {getStatusLabel(order.status)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="font-medium">{formatCurrency(order.total, order.currency_code)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">
                        {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">{formatDate(order.created_at)}</Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <Text className="text-gray-500">No hay pedidos registrados</Text>
          )}
        </div>
      </div>
    </Container>
  );
};

export default SupplierDetailView;