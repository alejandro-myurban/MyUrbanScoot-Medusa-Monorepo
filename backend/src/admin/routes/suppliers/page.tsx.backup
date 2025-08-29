import { Container, Heading, Table, Badge, Text, Button } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";
import {
  Eye,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Edit,
  Trash2,
  Building
} from "lucide-react";
import { sdk } from "../../lib/sdk";

type Supplier = {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  website?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  province: string;
  country_code: string;
  payment_terms: string;
  currency_code: string;
  discount_percentage: number;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

type SupplierOrder = {
  id: string;
  display_id: string;
  supplier_id: string;
  supplier: Supplier;
  status: string;
  total: number;
  currency_code: string;
  expected_delivery_date?: string;
  created_at: string;
};

const SuppliersPage = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [filterByStatus, setFilterByStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();

  // Formulario de creación/edición
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: "",
    legal_name: "",
    tax_id: "",
    email: "",
    phone: "",
    website: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    postal_code: "",
    province: "",
    country_code: "ES",
    payment_terms: "30",
    currency_code: "EUR",
    discount_percentage: 0,
    is_active: true
  });

  // Query para obtener proveedores
  const {
    data: suppliersData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/suppliers", {
        method: "GET",
      });
      return response as { suppliers: Supplier[] };
    },
  });

  // Query para obtener pedidos del proveedor seleccionado
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
  } = useQuery<{ orders: SupplierOrder[] }>({
    queryKey: ["supplier-orders", selectedSupplier?.id],
    queryFn: async () => {
      if (!selectedSupplier?.id) return { orders: [] };
      const response = await sdk.client.fetch(`/admin/suppliers/${selectedSupplier.id}/orders`, {
        method: "GET",
      });
      return response as { orders: SupplierOrder[] };
    },
    enabled: !!selectedSupplier?.id
  });

  // Mutation para crear proveedor
  const createSupplierMutation = useMutation({
    mutationFn: async (data: Partial<Supplier>) => {
      const response = await sdk.client.fetch("/admin/suppliers", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      alert("Error al crear el proveedor: " + error.message);
    }
  });

  // Mutation para actualizar proveedor
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Supplier> }) => {
      const response = await sdk.client.fetch(`/admin/suppliers/${id}`, {
        method: "PUT",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setSelectedSupplier(null);
      resetForm();
    },
    onError: (error: any) => {
      alert("Error al actualizar el proveedor: " + error.message);
    }
  });

  // Mutation para desactivar proveedor
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/suppliers/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      alert("Error al desactivar el proveedor: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      legal_name: "",
      tax_id: "",
      email: "",
      phone: "",
      website: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      postal_code: "",
      province: "",
      country_code: "ES",
      payment_terms: "30",
      currency_code: "EUR",
      discount_percentage: 0,
      is_active: true
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier);
    setShowCreateForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.id) {
      // Editar
      updateSupplierMutation.mutate({ id: formData.id, data: formData });
    } else {
      // Crear
      createSupplierMutation.mutate(formData);
    }
  };

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

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Gestión de Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          <Text>Cargando proveedores...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Gestión de Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-red-500">Error al cargar los proveedores</Text>
        </div>
      </Container>
    );
  }

  const suppliers: Supplier[] = suppliersData?.suppliers || [];
  const orders: SupplierOrder[] = ordersData?.orders || [];

  // Filtros
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesStatus = !filterByStatus || 
      (filterByStatus === "active" && supplier.is_active) ||
      (filterByStatus === "inactive" && !supplier.is_active);

    const matchesSearch = !searchTerm.trim() || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterByStatus, searchTerm]);

  // Vista detalle de proveedor
  if (selectedSupplier) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSelectedSupplier(null)}
            >
              ← Volver
            </Button>
            <Heading level="h2">Detalles del Proveedor</Heading>
          </div>
          <div className="flex items-center gap-2">
            <Badge size="small" className={selectedSupplier.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {selectedSupplier.is_active ? "Activo" : "Inactivo"}
            </Badge>
            <Button variant="secondary" size="small" onClick={() => handleEdit(selectedSupplier)}>
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
                  <Text className="font-medium">{selectedSupplier.name}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">Razón Social</Text>
                  <Text className="font-medium">{selectedSupplier.legal_name}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">NIF/CIF</Text>
                  <Text className="font-medium">{selectedSupplier.tax_id}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">Email</Text>
                  <Text className="font-medium">{selectedSupplier.email}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">Teléfono</Text>
                  <Text className="font-medium">{selectedSupplier.phone}</Text>
                </div>
                {selectedSupplier.website && (
                  <div>
                    <Text size="small" className="text-gray-600 dark:text-gray-400">Website</Text>
                    <a href={selectedSupplier.website} target="_blank" className="font-medium text-blue-600 hover:underline">
                      {selectedSupplier.website}
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
                  <Text className="font-medium">{selectedSupplier.address_line_1}</Text>
                  {selectedSupplier.address_line_2 && (
                    <Text className="text-gray-500">{selectedSupplier.address_line_2}</Text>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text size="small" className="text-gray-600 dark:text-gray-400">CP</Text>
                    <Text className="font-medium">{selectedSupplier.postal_code}</Text>
                  </div>
                  <div>
                    <Text size="small" className="text-gray-600 dark:text-gray-400">Ciudad</Text>
                    <Text className="font-medium">{selectedSupplier.city}</Text>
                  </div>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">Provincia</Text>
                  <Text className="font-medium">{selectedSupplier.province}</Text>
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
                <Text className="font-medium">{selectedSupplier.payment_terms} días</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Moneda</Text>
                <Text className="font-medium">{selectedSupplier.currency_code}</Text>
              </div>
              <div>
                <Text size="small" className="text-gray-600 dark:text-gray-400">Descuento General</Text>
                <Text className="font-medium">{selectedSupplier.discount_percentage}%</Text>
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
            <Heading level="h2">{formData.id ? "Editar" : "Crear"} Proveedor</Heading>
          </div>
        </div>

        <div className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Heading level="h3" className="text-lg">Información General</Heading>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre Comercial *</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Razón Social *</label>
                  <input
                    type="text"
                    value={formData.legal_name || ""}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">NIF/CIF *</label>
                  <input
                    type="text"
                    value={formData.tax_id || ""}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Heading level="h3" className="text-lg">Dirección</Heading>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Dirección *</label>
                  <input
                    type="text"
                    value={formData.address_line_1 || ""}
                    onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Dirección 2</label>
                  <input
                    type="text"
                    value={formData.address_line_2 || ""}
                    onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">CP *</label>
                    <input
                      type="text"
                      value={formData.postal_code || ""}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ciudad *</label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Provincia *</label>
                  <input
                    type="text"
                    value={formData.province || ""}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">País</label>
                  <select
                    value={formData.country_code || "ES"}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ES">España</option>
                    <option value="FR">Francia</option>
                    <option value="PT">Portugal</option>
                    <option value="IT">Italia</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">Condiciones Comerciales</Heading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Condiciones de Pago (días)</label>
                  <input
                    type="number"
                    value={formData.payment_terms || "30"}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <label className="block text-sm font-medium mb-2">Descuento General (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage || 0}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-500"
                />
                <Text>Proveedor activo</Text>
              </label>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
              >
                {createSupplierMutation.isPending || updateSupplierMutation.isPending ? "Guardando..." : "Guardar"}
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
        <Heading level="h2">Gestión de Proveedores</Heading>
        <div className="flex items-center gap-2">
          <Badge size="small">
            {filteredSuppliers.length}{" "}
            {filteredSuppliers.length === suppliers.length ? "proveedores" : `de ${suppliers.length} proveedores`}
          </Badge>
          <Button variant="primary" size="small" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterByStatus}
            onChange={(e) => setFilterByStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="active">✅ Activos</option>
            <option value="inactive">❌ Inactivos</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIF o email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm min-w-[250px]"
            />
          </div>
          {(filterByStatus || searchTerm) && (
            <button
              onClick={() => {
                setFilterByStatus("");
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
        {paginatedSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Text className="text-gray-500">
              {filteredSuppliers.length === 0 && (filterByStatus || searchTerm)
                ? "No se encontraron proveedores que coincidan con los filtros"
                : "No hay proveedores registrados todavía"}
            </Text>
            {filteredSuppliers.length === 0 && !filterByStatus && !searchTerm && (
              <Button variant="primary" size="small" className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                Crear primer proveedor
              </Button>
            )}
          </div>
        ) : (
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
              {paginatedSuppliers.map((supplier) => (
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
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => {
                          if (confirm("¿Estás seguro de que quieres desactivar este proveedor?")) {
                            deleteSupplierMutation.mutate(supplier.id);
                          }
                        }}
                        disabled={!supplier.is_active}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        {/* Paginación */}
        {filteredSuppliers.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Text size="small">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredSuppliers.length)} de {filteredSuppliers.length} proveedores
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
  label: "Proveedores",
  icon: Building,
});

export default SuppliersPage;