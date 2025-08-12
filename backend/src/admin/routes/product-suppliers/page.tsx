import { Container, Heading, Table, Badge, Text, Button } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";
import {
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Link,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Building,
  Clock,
  Star
} from "lucide-react";
import { sdk } from "../../lib/sdk";

type Supplier = {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
  is_active: boolean;
};

type ProductSupplier = {
  id: string;
  product_id: string;
  product_variant_id?: string;
  supplier_id: string;
  supplier: Supplier;
  supplier_sku?: string;
  cost_price: number;
  currency_code: string;
  minimum_order_quantity: number;
  lead_time_days: number;
  is_preferred_supplier: boolean;
  is_workshop_consumable: boolean;
  exclude_from_storefront: boolean;
  price_history?: any[];
  last_price_update?: string;
  created_at: string;
  updated_at: string;
};

const ProductSuppliersPage = () => {
  const [selectedRelation, setSelectedRelation] = useState<ProductSupplier | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [filterBySupplier, setFilterBySupplier] = useState<string>("");
  const [filterByPreferred, setFilterByPreferred] = useState<string>("");
  const [filterByWorkshop, setFilterByWorkshop] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPriceHistory, setShowPriceHistory] = useState<string | null>(null);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();

  // Formulario
  const [formData, setFormData] = useState<Partial<ProductSupplier>>({
    product_id: "",
    supplier_id: "",
    supplier_sku: "",
    cost_price: 0,
    currency_code: "EUR",
    minimum_order_quantity: 1,
    lead_time_days: 7,
    is_preferred_supplier: false,
    is_workshop_consumable: false,
    exclude_from_storefront: false,
  });

  // Query para obtener relaciones producto-proveedor
  const {
    data: relationsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ product_suppliers: ProductSupplier[] }>({
    queryKey: ["product-suppliers"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/suppliers/products", {
        method: "GET",
      });
      return response as { product_suppliers: ProductSupplier[] };
    },
  });

  // Query para obtener proveedores
  const { data: suppliersData } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/suppliers?is_active=true", {
        method: "GET",
      });
      return response as { suppliers: Supplier[] };
    },
  });

  // Mutation para crear relación
  const createRelationMutation = useMutation({
    mutationFn: async (data: Partial<ProductSupplier>) => {
      const response = await sdk.client.fetch("/admin/suppliers/products", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-suppliers"] });
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      alert("Error al crear la relación: " + error.message);
    }
  });

  // Mutation para actualizar precio
  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, cost_price }: { id: string, cost_price: number }) => {
      const response = await sdk.client.fetch(`/admin/suppliers/products/${id}`, {
        method: "PUT",
        body: { cost_price },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-suppliers"] });
    },
    onError: (error: any) => {
      alert("Error al actualizar el precio: " + error.message);
    }
  });

  // Mutation para actualizar relación
  const updateRelationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ProductSupplier> }) => {
      const response = await sdk.client.fetch(`/admin/suppliers/products/${id}`, {
        method: "PUT",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-suppliers"] });
      setSelectedRelation(null);
      resetForm();
    },
    onError: (error: any) => {
      alert("Error al actualizar la relación: " + error.message);
    }
  });

  // Mutation para eliminar relación
  const deleteRelationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/suppliers/products/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-suppliers"] });
    },
    onError: (error: any) => {
      alert("Error al eliminar la relación: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      product_id: "",
      supplier_id: "",
      supplier_sku: "",
      cost_price: 0,
      currency_code: "EUR",
      minimum_order_quantity: 1,
      lead_time_days: 7,
      is_preferred_supplier: false,
      is_workshop_consumable: false,
      exclude_from_storefront: false,
    });
  };

  const handleEdit = (relation: ProductSupplier) => {
    setFormData(relation);
    setShowCreateForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.id) {
      // Editar
      updateRelationMutation.mutate({ id: formData.id, data: formData });
    } else {
      // Crear
      createRelationMutation.mutate(formData);
    }
  };

  const handleQuickPriceUpdate = (relationId: string, currentPrice: number) => {
    const newPrice = prompt("Nuevo precio:", currentPrice.toString());
    if (newPrice && !isNaN(parseFloat(newPrice))) {
      updatePriceMutation.mutate({ id: relationId, cost_price: parseFloat(newPrice) });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const calculatePriceChange = (priceHistory?: any[], currentPrice?: number) => {
    if (!priceHistory || priceHistory.length === 0 || !currentPrice) return null;
    
    const lastHistoricalPrice = priceHistory[priceHistory.length - 1];
    if (!lastHistoricalPrice) return null;
    
    const oldPrice = lastHistoricalPrice.old_price || lastHistoricalPrice.price;
    const change = currentPrice - oldPrice;
    const changePercent = ((change / oldPrice) * 100);
    
    return {
      change,
      changePercent,
      isIncrease: change > 0,
      isDecrease: change < 0,
    };
  };

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Productos y Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          <Text>Cargando relaciones...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Productos y Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-red-500">Error al cargar las relaciones</Text>
        </div>
      </Container>
    );
  }

  const relations: ProductSupplier[] = relationsData?.product_suppliers || [];
  const suppliers: Supplier[] = suppliersData?.suppliers || [];

  // Filtros
  const filteredRelations = relations.filter((relation) => {
    const matchesSupplier = !filterBySupplier || relation.supplier_id === filterBySupplier;
    const matchesPreferred = !filterByPreferred ||
      (filterByPreferred === "preferred" && relation.is_preferred_supplier) ||
      (filterByPreferred === "not_preferred" && !relation.is_preferred_supplier);
    const matchesWorkshop = !filterByWorkshop ||
      (filterByWorkshop === "workshop" && relation.is_workshop_consumable) ||
      (filterByWorkshop === "regular" && !relation.is_workshop_consumable);

    const matchesSearch = !searchTerm.trim() || 
      relation.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.supplier_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSupplier && matchesPreferred && matchesWorkshop && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredRelations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRelations = filteredRelations.slice(startIndex, endIndex);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBySupplier, filterByPreferred, filterByWorkshop, searchTerm]);

  // Buscar la relación para el historial DESPUÉS de todos los hooks
  const selectedRelationForHistory = showPriceHistory ? relations.find(r => r.id === showPriceHistory) : null;

  // Si se solicitó mostrar historial pero no se encuentra la relación, resetear el estado
  useEffect(() => {
    if (showPriceHistory && !selectedRelationForHistory) {
      setShowPriceHistory(null);
    }
  }, [showPriceHistory, selectedRelationForHistory]);

  // Vista de historial de precios - DESPUÉS de todos los hooks
  if (showPriceHistory && selectedRelationForHistory) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => setShowPriceHistory(null)}>
              ← Volver
            </Button>
            <Heading level="h2">Historial de Precios</Heading>
          </div>
        </div>

        <div className="px-6 py-8 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Text size="small" className="text-gray-600">Producto</Text>
                <Text className="font-medium">{selectedRelationForHistory.product_id}</Text>
                {selectedRelationForHistory.supplier_sku && (
                  <Text size="small" className="text-gray-500">Ref: {selectedRelationForHistory.supplier_sku}</Text>
                )}
              </div>
              <div>
                <Text size="small" className="text-gray-600">Proveedor</Text>
                <Text className="font-medium">{selectedRelationForHistory.supplier.name}</Text>
                <Text size="small" className="text-gray-500">{selectedRelationForHistory.supplier.legal_name}</Text>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Heading level="h3" className="text-lg">Precio Actual</Heading>
              <Button 
                variant="secondary" 
                size="small"
                onClick={() => handleQuickPriceUpdate(selectedRelationForHistory.id, selectedRelationForHistory.cost_price)}
              >
                <Edit className="w-4 h-4" />
                Actualizar Precio
              </Button>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <Text className="text-3xl font-bold text-blue-800 dark:text-blue-300">
                {formatCurrency(selectedRelationForHistory.cost_price, selectedRelationForHistory.currency_code)}
              </Text>
              {selectedRelationForHistory.last_price_update && (
                <Text size="small" className="text-blue-600">
                  Actualizado: {formatDate(selectedRelationForHistory.last_price_update)}
                </Text>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Historial de Cambios</Heading>
            
            {selectedRelationForHistory.price_history && selectedRelationForHistory.price_history.length > 0 ? (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Fecha</Table.HeaderCell>
                    <Table.HeaderCell>Precio Anterior</Table.HeaderCell>
                    <Table.HeaderCell>Precio Nuevo</Table.HeaderCell>
                    <Table.HeaderCell>Cambio</Table.HeaderCell>
                    <Table.HeaderCell>Usuario</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {selectedRelationForHistory.price_history.map((entry: any, index: number) => {
                    const oldPrice = entry.old_price || entry.price;
                    const newPrice = entry.new_price || selectedRelationForHistory.cost_price;
                    const change = newPrice - oldPrice;
                    const changePercent = ((change / oldPrice) * 100);
                    
                    return (
                      <Table.Row key={index}>
                        <Table.Cell>
                          <Text size="small">{formatDate(entry.changed_at || entry.date)}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text>{formatCurrency(oldPrice, selectedRelationForHistory.currency_code)}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text className="font-medium">{formatCurrency(newPrice, selectedRelationForHistory.currency_code)}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            {change > 0 ? (
                              <TrendingUp className="w-4 h-4 text-red-600" />
                            ) : change < 0 ? (
                              <TrendingDown className="w-4 h-4 text-green-600" />
                            ) : null}
                            <Text className={`font-medium ${
                              change > 0 ? "text-red-600" : 
                              change < 0 ? "text-green-600" : "text-gray-600"
                            }`}>
                              {change > 0 ? "+" : ""}{formatCurrency(change, selectedRelationForHistory.currency_code)}
                            </Text>
                            <Text size="small" className="text-gray-500">
                              ({change > 0 ? "+" : ""}{changePercent.toFixed(1)}%)
                            </Text>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="small" className="text-gray-500">
                            {entry.changed_by || "Sistema"}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <Text className="text-gray-500">No hay historial de cambios de precios</Text>
              </div>
            )}
          </div>
        </div>
      </Container>
    );
  }

  // Formulario de creación/edición
  if (showCreateForm) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => { setShowCreateForm(false); resetForm(); }}>
              ← Volver
            </Button>
            <Heading level="h2">{formData.id ? "Editar" : "Crear"} Relación Producto-Proveedor</Heading>
          </div>
        </div>

        <div className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Heading level="h3" className="text-lg">Información Básica</Heading>
                
                <div>
                  <label className="block text-sm font-medium mb-2">ID del Producto *</label>
                  <input
                    type="text"
                    value={formData.product_id || ""}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="prod_123..."
                    disabled={!!formData.id} // No editable si estamos editando
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Proveedor *</label>
                  <select
                    value={formData.supplier_id || ""}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!formData.id} // No editable si estamos editando
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.tax_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Referencia del Proveedor</label>
                  <input
                    type="text"
                    value={formData.supplier_sku || ""}
                    onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU o código del proveedor"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Heading level="h3" className="text-lg">Precios y Condiciones</Heading>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Precio de Costo *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price || 0}
                      onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Moneda</label>
                    <select
                      value={formData.currency_code || "EUR"}
                      onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cantidad Mínima de Pedido</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minimum_order_quantity || 1}
                      onChange={(e) => setFormData({ ...formData, minimum_order_quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tiempo de Entrega (días)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.lead_time_days || 7}
                      onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 7 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">Opciones Especiales</Heading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_preferred_supplier ?? false}
                    onChange={(e) => setFormData({ ...formData, is_preferred_supplier: e.target.checked })}
                    className="w-4 h-4 text-blue-500"
                  />
                  <div>
                    <Text className="font-medium">Proveedor Preferente</Text>
                    <Text size="small" className="text-gray-500">Primera opción para pedidos</Text>
                  </div>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_workshop_consumable ?? false}
                    onChange={(e) => setFormData({ ...formData, is_workshop_consumable: e.target.checked })}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div>
                    <Text className="font-medium">Consumible de Taller</Text>
                    <Text size="small" className="text-gray-500">Producto de uso interno</Text>
                  </div>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.exclude_from_storefront ?? false}
                    onChange={(e) => setFormData({ ...formData, exclude_from_storefront: e.target.checked })}
                    className="w-4 h-4 text-red-500"
                  />
                  <div>
                    <Text className="font-medium">Ocultar en Tienda</Text>
                    <Text size="small" className="text-gray-500">No mostrar online</Text>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={createRelationMutation.isPending || updateRelationMutation.isPending}
              >
                {createRelationMutation.isPending || updateRelationMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowCreateForm(false); resetForm(); }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </Container>
    );
  }

  // Vista principal de listado
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Productos y Proveedores</Heading>
        <div className="flex items-center gap-2">
          <Badge size="small">
            {filteredRelations.length}{" "}
            {filteredRelations.length === relations.length ? "relaciones" : `de ${relations.length} relaciones`}
          </Badge>
          <Button variant="primary" size="small" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Nueva Relación
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-600" />
              <Text size="small" className="text-blue-600">Total Relaciones</Text>
            </div>
            <Text className="text-2xl font-bold text-blue-800 dark:text-blue-300">{relations.length}</Text>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <Text size="small" className="text-yellow-600">Preferentes</Text>
            </div>
            <Text className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">
              {relations.filter(r => r.is_preferred_supplier).length}
            </Text>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              <Text size="small" className="text-orange-600">Taller</Text>
            </div>
            <Text className="text-2xl font-bold text-orange-800 dark:text-orange-300">
              {relations.filter(r => r.is_workshop_consumable).length}
            </Text>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <Text size="small" className="text-green-600">Valor Promedio</Text>
            </div>
            <Text className="text-xl font-bold text-green-800 dark:text-green-300">
              {formatCurrency(relations.length > 0 ? relations.reduce((sum, r) => sum + r.cost_price, 0) / relations.length : 0)}
            </Text>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterBySupplier}
            onChange={(e) => setFilterBySupplier(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <select
            value={filterByPreferred}
            onChange={(e) => setFilterByPreferred(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos (preferencia)</option>
            <option value="preferred">⭐ Preferentes</option>
            <option value="not_preferred">➖ No preferentes</option>
          </select>
          <select
            value={filterByWorkshop}
            onChange={(e) => setFilterByWorkshop(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos (tipo)</option>
            <option value="workshop">🔧 Taller</option>
            <option value="regular">🛒 Regular</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, SKU o proveedor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm min-w-[250px]"
            />
          </div>
          {(filterBySupplier || filterByPreferred || filterByWorkshop || searchTerm) && (
            <button
              onClick={() => {
                setFilterBySupplier("");
                setFilterByPreferred("");
                setFilterByWorkshop("");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-8">
        {paginatedRelations.length === 0 ? (
          <div className="text-center py-8">
            <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Text className="text-gray-500">
              {filteredRelations.length === 0 && (filterBySupplier || filterByPreferred || filterByWorkshop || searchTerm)
                ? "No se encontraron relaciones que coincidan con los filtros"
                : "No hay relaciones producto-proveedor registradas"}
            </Text>
            {filteredRelations.length === 0 && !filterBySupplier && !filterByPreferred && !filterByWorkshop && !searchTerm && (
              <Button variant="primary" size="small" className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                Crear primera relación
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Producto</Table.HeaderCell>
                <Table.HeaderCell>Proveedor</Table.HeaderCell>
                <Table.HeaderCell>Precio</Table.HeaderCell>
                <Table.HeaderCell>Condiciones</Table.HeaderCell>
                <Table.HeaderCell>Características</Table.HeaderCell>
                <Table.HeaderCell>Última Actualización</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedRelations.map((relation) => {
                const priceChange = calculatePriceChange(relation.price_history, relation.cost_price);
                
                return (
                  <Table.Row key={relation.id}>
                    <Table.Cell>
                      <div className="space-y-1">
                        <Text className="font-medium font-mono">{relation.product_id}</Text>
                        {relation.supplier_sku && (
                          <Text size="small" className="text-gray-500">Ref: {relation.supplier_sku}</Text>
                        )}
                        {relation.product_variant_id && (
                          <Text size="small" className="text-gray-400">Variante: {relation.product_variant_id}</Text>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1">
                        <Text className="font-medium">{relation.supplier.name}</Text>
                        <Text size="small" className="text-gray-500">{relation.supplier.tax_id}</Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Text className="font-semibold">{formatCurrency(relation.cost_price, relation.currency_code)}</Text>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleQuickPriceUpdate(relation.id, relation.cost_price)}
                            disabled={updatePriceMutation.isPending}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                        {priceChange && (
                          <div className="flex items-center gap-1">
                            {priceChange.isIncrease ? (
                              <TrendingUp className="w-3 h-3 text-red-500" />
                            ) : priceChange.isDecrease ? (
                              <TrendingDown className="w-3 h-3 text-green-500" />
                            ) : null}
                            <Text size="small" className={`${
                              priceChange.isIncrease ? "text-red-500" : 
                              priceChange.isDecrease ? "text-green-500" : "text-gray-500"
                            }`}>
                              {priceChange.isIncrease ? "+" : ""}{priceChange.changePercent.toFixed(1)}%
                            </Text>
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1">
                        <Text size="small">Min: {relation.minimum_order_quantity} uds</Text>
                        <Text size="small" className="text-gray-500">Entrega: {relation.lead_time_days} días</Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {relation.is_preferred_supplier && (
                          <Badge size="small" className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3" />
                            Preferente
                          </Badge>
                        )}
                        {relation.is_workshop_consumable && (
                          <Badge size="small" className="bg-orange-100 text-orange-800">
                            <Package className="w-3 h-3" />
                            Taller
                          </Badge>
                        )}
                        {relation.exclude_from_storefront && (
                          <Badge size="small" className="bg-red-100 text-red-800">
                            Oculto
                          </Badge>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-gray-400">
                        {formatDate(relation.updated_at)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => setShowPriceHistory(relation.id)}
                        >
                          <DollarSign className="w-4 h-4" />
                          Historial
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleEdit(relation)}
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            if (confirm("¿Estás seguro de que quieres eliminar esta relación?")) {
                              deleteRelationMutation.mutate(relation.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}

        {/* Paginación */}
        {filteredRelations.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Text size="small">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRelations.length)} de {filteredRelations.length} relaciones
              </Text>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + index;
                  } else {
                    pageNumber = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNumber
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Productos y Proveedores",
  icon: Link,
});

export default ProductSuppliersPage;