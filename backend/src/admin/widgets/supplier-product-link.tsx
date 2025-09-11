import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Select, Badge, Text, IconButton, Prompt, Textarea } from "@medusajs/ui";
import { useEffect, useState } from "react";
import {
  DetailWidgetProps,
  AdminProduct,
} from "@medusajs/framework/types";
import { Plus, Edit, Trash2, Package, User, DollarSign, AlertTriangle } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  code?: string;
  is_active: boolean;
}

interface ProductSupplier {
  id: string;
  product_id: string;
  supplier: Supplier;
  supplier_sku?: string;
  supplier_product_url?: string;
  cost_price?: number;
  currency_code: string;
  is_preferred_supplier: boolean;
  is_active: boolean;
  last_purchase_date?: string;
  last_price_update?: string;
  notes?: string;
}

const SupplierProductLinkWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRelation, setEditingRelation] = useState<ProductSupplier | null>(null);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [relationToDelete, setRelationToDelete] = useState<ProductSupplier | null>(null);
  
  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [supplierSku, setSupplierSku] = useState<string>("");
  const [supplierProductUrl, setSupplierProductUrl] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isPreferred, setIsPreferred] = useState<boolean>(false);

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
    fetchProductSuppliers();
  }, [data.id]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/admin/suppliers?is_active=true&limit=100", {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Error fetching suppliers");
      
      const result = await response.json();
      setSuppliers(result.suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Error cargando proveedores");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSuppliers = async () => {
    if (!data.id) return;
    
    try {
      const response = await fetch(`/admin/suppliers/products?product_id=${data.id}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Error fetching product suppliers");
      
      const result = await response.json();
      setProductSuppliers(result.product_suppliers || []);
    } catch (error) {
      console.error("Error fetching product suppliers:", error);
      toast.error("Error cargando relaciones con proveedores");
    }
  };

  const resetForm = () => {
    setSelectedSupplierId("");
    setSupplierSku("");
    setSupplierProductUrl("");
    setCostPrice("");
    setNotes("");
    setIsPreferred(false);
    setShowAddForm(false);
    setEditingRelation(null);
  };

  const handleSaveRelation = async () => {
    if (!selectedSupplierId) {
      toast.error("Debe seleccionar un proveedor");
      return;
    }

    // Check if supplier is already linked (for new relations)
    if (!editingRelation) {
      const isAlreadyLinked = productSuppliers.some(
        ps => ps.supplier.id === selectedSupplierId
      );
      if (isAlreadyLinked) {
        toast.error("Este proveedor ya está asociado con el producto");
        return;
      }
    }

    const relationData = {
      product_id: data.id,
      supplier_id: selectedSupplierId,
      supplier_sku: supplierSku || null,
      supplier_product_url: supplierProductUrl || null,
      cost_price: costPrice ? parseFloat(costPrice) : null,
      currency_code: "EUR",
      is_preferred_supplier: isPreferred,
      is_active: true,
      notes: notes || null,
    };

    try {
      setLoading(true);
      
      let response;
      if (editingRelation) {
        // For updates, only send the fields that can be updated
        const updateData = {
          supplier_sku: supplierSku || null,
          supplier_product_url: supplierProductUrl || null,
          cost_price: costPrice ? parseFloat(costPrice) : null,
          is_preferred_supplier: isPreferred,
          notes: notes || null,
        };
        
        response = await fetch(`/admin/suppliers/products/${editingRelation.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updateData),
        });
      } else {
        // Create new relation
        response = await fetch("/admin/suppliers/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(relationData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error saving relation");
      }

      toast.success(editingRelation ? "Relación actualizada" : "Proveedor asociado correctamente");
      resetForm();
      fetchProductSuppliers(); // Refresh the list
    } catch (error) {
      console.error("Error saving relation:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al guardar la relación";
      
      if (errorMessage.includes("already linked")) {
        toast.error("Este proveedor ya está asociado con el producto");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditRelation = (relation: ProductSupplier) => {
    setEditingRelation(relation);
    setSelectedSupplierId(relation.supplier.id);
    setSupplierSku(relation.supplier_sku || "");
    setSupplierProductUrl(relation.supplier_product_url || "");
    setCostPrice(relation.cost_price ? relation.cost_price.toString() : "");
    setNotes(relation.notes || "");
    setIsPreferred(relation.is_preferred_supplier);
    setShowAddForm(true);
  };

  const handleDeleteClick = (relation: ProductSupplier) => {
    setRelationToDelete(relation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!relationToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/admin/suppliers/products/${relationToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Error deleting relation");

      toast.success("Relación eliminada correctamente");
      fetchProductSuppliers(); // Refresh the list
      setShowDeleteModal(false);
      setRelationToDelete(null);
    } catch (error) {
      console.error("Error deleting relation:", error);
      toast.error("Error al eliminar la relación");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRelationToDelete(null);
  };

  const formatPrice = (price: number | undefined, currency = "EUR") => {
    if (!price) return "Sin precio";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  return (
    <Container>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Text size="large" weight="plus" className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gestión de Proveedores
            </Text>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Asocia este producto con proveedores y gestiona precios.
            </Text>
          </div>
          
          {!showAddForm && (
            <Button
              size="small"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir Proveedor
            </Button>
          )}
        </div>

        {/* Existing Relations */}
        {productSuppliers.length > 0 && (
          <div className="space-y-2">
            <Text weight="plus" size="small">
              Proveedores Asociados ({productSuppliers.length})
            </Text>
            
            <div className="space-y-2">
              {productSuppliers.map((relation) => (
                <div
                  key={relation.id}
                  className="flex items-center justify-between p-3 border border-ui-border-base rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-ui-fg-subtle" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Text weight="plus" size="small">
                          {relation.supplier.name}
                        </Text>
                        {relation.is_preferred_supplier && (
                          <Badge size="xsmall" color="green">Principal</Badge>
                        )}
                        {relation.supplier.code && (
                          <Badge size="xsmall" >
                            {relation.supplier.code}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1">
                        {relation.supplier_sku && (
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            SKU: {relation.supplier_sku}
                          </Text>
                        )}
                        <Text size="xsmall" className="text-ui-fg-subtle flex items-center gap-1">
                          Precio: {" "}
                          {formatPrice(relation.cost_price, relation.currency_code)}
                        </Text>
                      </div>
                      
                      {/* Notes display */}
                      {relation.notes && (
                        <div className="mt-2 p-2 bg-ui-bg-base rounded border border-ui-border-base">
                          <Text size="xsmall" className="text-ui-fg-subtle italic">
                            {relation.notes}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <IconButton
                      size="small"
                      variant="transparent"
                      onClick={() => handleEditRelation(relation)}
                    >
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      size="small"
                      variant="transparent"
                      onClick={() => handleDeleteClick(relation)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="border border-ui-border-base rounded-lg p-4 space-y-4 bg-ui-bg-subtle">
            <div className="flex items-center justify-between">
              <Text weight="plus">
                {editingRelation ? "Editar Relación" : "Añadir Nuevo Proveedor"}
              </Text>
              <Button
                size="small"
                variant="transparent"
                onClick={resetForm}
              >
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              {/* Supplier Selection */}
              <div>
                <Text size="small" weight="plus" className="mb-2">
                  Proveedor *
                </Text>
                <Select
                  value={selectedSupplierId}
                  onValueChange={setSelectedSupplierId}
                  disabled={loading || !!editingRelation}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Seleccionar proveedor..." />
                  </Select.Trigger>
                  <Select.Content>
                    {suppliers.map((supplier) => (
                      <Select.Item key={supplier.id} value={supplier.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{supplier.name}</span>
                          {supplier.code && (
                            <Badge size="xsmall" className="ml-2">
                              {supplier.code}
                            </Badge>
                          )}
                        </div>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              {/* Grid for main fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier SKU */}
                <div>
                  <Text size="small" weight="plus" className="mb-2">
                    SKU del Proveedor
                  </Text>
                  <Input
                    value={supplierSku}
                    onChange={(e) => setSupplierSku(e.target.value)}
                    placeholder="Código del producto en el proveedor..."
                    disabled={loading}
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <Text size="small" weight="plus" className="mb-2">
                    Precio (€)
                  </Text>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Supplier Product URL - Full width */}
              <div>
                <Text size="small" weight="plus" className="mb-2">
                  URL del Producto
                </Text>
                <Input
                  type="url"
                  value={supplierProductUrl}
                  onChange={(e) => setSupplierProductUrl(e.target.value)}
                  placeholder="https://proveedor.com/producto"
                  disabled={loading}
                />
              </div>

              {/* Notes - Full width */}
              <div>
                <Text size="small" weight="plus" className="mb-2">
                  Notas
                </Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales sobre este proveedor o producto..."
                  disabled={loading}
                  rows={3}
                />
              </div>

              {/* Preferred Supplier Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="preferred-supplier"
                  checked={isPreferred}
                  onChange={(e) => setIsPreferred(e.target.checked)}
                  disabled={loading}
                  className="rounded border-ui-border-base"
                />
                <label htmlFor="preferred-supplier">
                  <Text size="small">
                    Marcar como proveedor preferido
                  </Text>
                </label>
              </div>
            </div>

            <Button
              onClick={handleSaveRelation}
              disabled={loading || !selectedSupplierId}
              className="w-full"
            >
              {loading ? "Guardando..." : editingRelation ? "Actualizar Relación" : "Crear Relación"}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {productSuppliers.length === 0 && !showAddForm && (
          <div className="text-center py-8 border border-dashed border-ui-border-base rounded-lg">
            <Package className="h-8 w-8 mx-auto text-ui-fg-subtle mb-2" />
            <Text className="text-ui-fg-subtle">
              Este producto no está asociado con ningún proveedor
            </Text>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Añade proveedores para gestionar precios de coste y referencias
            </Text>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Prompt open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <Prompt.Content>
            <Prompt.Header>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-bg-base-pressed">
                  <AlertTriangle className="h-4 w-4 text-ui-fg-base" />
                </div>
                <Prompt.Title>Eliminar Relación con Proveedor</Prompt.Title>
              </div>
              <Prompt.Description>
                ¿Está seguro de que desea eliminar la relación con{" "}
                <span className="font-medium">
                  {relationToDelete?.supplier?.name}
                </span>
                ? Esta acción no se puede deshacer.
              </Prompt.Description>
            </Prompt.Header>
            <Prompt.Footer>
              <Prompt.Cancel className="py-2 px-3" onClick={handleDeleteCancel}>
                Cancelar
              </Prompt.Cancel>
              <Prompt.Action 
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="flex items-center gap-2 py-2 px-3"
              >
                {loading ? (
                  <>Eliminando...</>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </>
                )}
              </Prompt.Action>
            </Prompt.Footer>
          </Prompt.Content>
        </Prompt>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default SupplierProductLinkWidget;