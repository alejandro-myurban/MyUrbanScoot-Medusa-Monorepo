import React from "react";
import { Table, Badge, Text, Button } from "@medusajs/ui";
import { Eye, Edit, Trash2, Building, Plus } from "lucide-react";
import { Supplier } from "../types";

interface SuppliersTableProps {
  suppliers: Supplier[];
  onViewSupplier: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onCreateSupplier: () => void;
  isDeleting?: boolean;
  totalSuppliers: number;
  hasFilters: boolean;
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
  onViewSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onCreateSupplier,
  isDeleting = false,
  totalSuppliers,
  hasFilters,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <Text className="text-gray-500">
          {totalSuppliers === 0 && !hasFilters
            ? "No hay proveedores registrados todavía"
            : "No se encontraron proveedores que coincidan con los filtros"}
        </Text>
        {totalSuppliers === 0 && !hasFilters && (
          <Button variant="primary" size="small" className="mt-4" onClick={onCreateSupplier}>
            <Plus className="w-4 h-4" />
            Crear primer proveedor
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Estado</Table.HeaderCell>
          <Table.HeaderCell>Proveedor</Table.HeaderCell>
          <Table.HeaderCell>Contacto</Table.HeaderCell>
          <Table.HeaderCell>Ubicación</Table.HeaderCell>
          <Table.HeaderCell>Condiciones</Table.HeaderCell>
          <Table.HeaderCell>Fecha Alta</Table.HeaderCell>
          <Table.HeaderCell>Acciones</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {suppliers.map((supplier) => (
          <Table.Row key={supplier.id}>
            <Table.Cell>
              <Badge
                size="small"
                className={supplier.is_active 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {supplier.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <div className="space-y-1">
                <Text className="font-medium">{supplier.name}</Text>
                <Text size="small" className="text-gray-500">{supplier.legal_name}</Text>
                <Text size="small" className="text-gray-400">{supplier.tax_id}</Text>
              </div>
            </Table.Cell>
            <Table.Cell>
              <div className="space-y-1">
                <Text size="small">📧 {supplier.email}</Text>
                <Text size="small">📞 {supplier.phone}</Text>
              </div>
            </Table.Cell>
            <Table.Cell>
              <div className="space-y-1">
                <Text size="small">{supplier.city}</Text>
                <Text size="small" className="text-gray-500">{supplier.province}</Text>
              </div>
            </Table.Cell>
            <Table.Cell>
              <div className="space-y-1">
                <Text size="small">{supplier.payment_terms} días</Text>
                <Text size="small" className="text-gray-500">{supplier.currency_code}</Text>
                {supplier.discount_percentage > 0 && (
                  <Text size="small" className="text-green-600">-{supplier.discount_percentage}%</Text>
                )}
              </div>
            </Table.Cell>
            <Table.Cell>
              <Text size="small" className="text-gray-400">
                {formatDate(supplier.created_at)}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onViewSupplier(supplier)}
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onEditSupplier(supplier)}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    if (confirm("¿Estás seguro de que quieres desactivar este proveedor?")) {
                      onDeleteSupplier(supplier.id);
                    }
                  }}
                  disabled={!supplier.is_active || isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};

export default SuppliersTable;