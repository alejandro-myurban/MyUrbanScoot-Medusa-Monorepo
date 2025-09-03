import { Container, Heading, Badge, Text, Button } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";
import { Plus, Package } from "lucide-react";
import { sdk } from "../../lib/sdk";
import CreateOrderForm from "./components/CreateOrderForm";
import ReceiveModal from "./components/ReceiveModal";
import OrderDetailView from "./components/OrderDetailView";
import OrderFilters from "./components/OrderFilters";
import OrdersTable from "./components/OrdersTable";
import Pagination from "./components/Pagination";
import { SupplierOrder, SupplierOrderLine, Supplier } from "./types";

// Types moved to separate file

const SupplierOrdersPage = () => {
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | null>(null);
  const [filterByStatus, setFilterByStatus] = useState<string>("");
  const [filterBySupplier, setFilterBySupplier] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Modal states - now using single modal component
  const [receiveModalState, setReceiveModalState] = useState<{
    type: 'partial' | 'complete' | 'incident' | null;
    line: SupplierOrderLine | null;
  }>({ type: null, line: null });
  
  const itemsPerPage = 15;
  const queryClient = useQueryClient();

  // Query para obtener estados válidos de un pedido
  const { data: validStatuses } = useQuery<{ validNextStatuses: string[] } | null>({
    queryKey: ['valid-statuses', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return null;
      const response = await sdk.client.fetch(`/admin/suppliers/orders/${selectedOrder.id}/valid-statuses`);
      return response as { validNextStatuses: string[] };
    },
    enabled: !!selectedOrder?.id
  });

  // Simple state for order form management
  const resetOrderForm = () => {
    // This function is kept for compatibility with the onCancel callback
    console.log("Order form reset");
  };

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterByStatus, filterBySupplier, searchTerm]);

  // Query para obtener pedidos
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ orders: SupplierOrder[] }>({
    queryKey: ["supplier-orders"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/suppliers/orders?limit=1000&include_lines=true", {
        method: "GET",
      });
      return response as { orders: SupplierOrder[] };
    },
  });

  // Query para obtener proveedores
  const { data: suppliersData } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/suppliers", {
        method: "GET",
      });
      return response as { suppliers: Supplier[] };
    },
  });

  // Query para obtener productos reales de la DB
  const { data: productsData } = useQuery<{ products: any[] }>({
    queryKey: ["products"],
    queryFn: async () => {
      console.log("🚀 Cargando todos los productos...");
      const response = await sdk.client.fetch("/admin/products?limit=1000", {
        method: "GET",
      });
      console.log("🔍 DEBUG - Productos cargados:", response);
      return response as { products: any[] };
    },
  });

  // Query para obtener ubicaciones/almacenes de Medusa
  const { data: locationsData } = useQuery<{ stock_locations: any[] }>({
    queryKey: ["stock-locations"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/stock-locations", {
        method: "GET",
      });
      return response as { stock_locations: any[] };
    },
  });

  // Query para obtener información del usuario actual
  const { data: currentUserData } = useQuery<{ user: any }>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/users/me", {
        method: "GET",
      });
      return response as { user: any };
    },
  });


  // Query para obtener líneas del pedido seleccionado
  const {
    data: orderLinesData,
    isLoading: isLoadingLines,
  } = useQuery<{ lines: SupplierOrderLine[] }>({
    queryKey: ["supplier-order-lines", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return { lines: [] };
      const response = await sdk.client.fetch(`/admin/suppliers/orders/${selectedOrder.id}/lines`, {
        method: "GET",
      });
      return response as { lines: SupplierOrderLine[] };
    },
    enabled: !!selectedOrder?.id
  });

  // Query específica para líneas del pedido que se está editando
  const {
    data: editingOrderLinesData,
    isLoading: isLoadingEditingLines,
    error: editingLinesError,
  } = useQuery<{ lines: SupplierOrderLine[] }>({
    queryKey: ["editing-order-lines", editingOrder?.id],
    queryFn: async () => {
      if (!editingOrder?.id) return { lines: [] };
      console.log("🔍 Fetching lines for editing order:", editingOrder.id);
      try {
        const response = await sdk.client.fetch(`/admin/suppliers/orders/${editingOrder.id}/lines`, {
          method: "GET",
        });
        console.log("✅ Editing order lines response:", response);
        return response as { lines: SupplierOrderLine[] };
      } catch (error) {
        console.error("❌ Error fetching editing order lines:", error);
        throw error;
      }
    },
    enabled: !!editingOrder?.id,
  });

  // Mutation para cambiar estado del pedido
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      console.log(`🔄 Frontend: Cambiando estado del pedido ${orderId} a ${status}`);
      const response = await sdk.client.fetch(`/admin/suppliers/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status },
      });
      console.log(`✅ Frontend: Respuesta recibida:`, response);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidar todas las queries relacionadas con pedidos
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ["supplier-order-lines", selectedOrder.id] });
      }
      
      // También invalidar la query del pedido específico que se actualizó
      queryClient.invalidateQueries({ queryKey: ["supplier-order", variables.orderId] });
      
      // Forzar un refetch inmediato
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["supplier-orders"] });
      }, 100);
    },
    onError: (error: any) => {
      alert("Error al cambiar el estado: " + error.message);
    }
  });

  // Mutation para actualizar incidencias de línea
  const updateLineIncidentMutation = useMutation({
    mutationFn: async ({ lineId, hasIncident, notes, userId }: { lineId: string, hasIncident: boolean, notes?: string, userId?: string }) => {
      console.log(`🚨 Frontend: Actualizando incidencia de línea ${lineId}: ${hasIncident}`);
      const response = await sdk.client.fetch(`/admin/suppliers/orders/lines/${lineId}/incident`, {
        method: "PATCH",
        body: { hasIncident, incidentNotes: notes, userId },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-order-lines"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      
      closeReceiveModal();
    },
    onError: (error: any) => {
      console.error(`❌ Error al actualizar incidencia:`, error);
      alert("Error al actualizar incidencia: " + error.message);
    }
  });

  // Mutation para agregar línea al pedido
  const addLineMutation = useMutation({
    mutationFn: async ({ orderId, lineData }: { orderId: string, lineData: any }) => {
      const response = await sdk.client.fetch(`/admin/suppliers/orders/${orderId}/lines`, {
        method: "POST",
        body: lineData,
      });
      return response;
    },
    onSuccess: () => {
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ["supplier-order-lines", selectedOrder.id] });
        queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      }
    },
    onError: (error: any) => {
      alert("Error al agregar la línea: " + error.message);
    }
  });

  // Mutation para recepcionar línea
  const receiveLineMutation = useMutation({
    mutationFn: async ({ lineId, data }: { lineId: string, data: any }) => {
      const response = await sdk.client.fetch(`/admin/suppliers/orders/lines/${lineId}/receive`, {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ["supplier-order-lines", selectedOrder.id] });
        queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      }
      closeReceiveModal();
    },
    onError: (error: any) => {
      alert("Error al recepcionar: " + error.message);
    }
  });



  // Modal handlers
  const handleReceiveItems = (line: SupplierOrderLine) => {
    setReceiveModalState({ type: 'partial', line });
  };

  const handleCompleteReceive = (line: SupplierOrderLine) => {
    setReceiveModalState({ type: 'complete', line });
  };

  const handleIncidentModal = (line: SupplierOrderLine) => {
    setReceiveModalState({ type: 'incident', line });
  };

  const closeReceiveModal = () => {
    setReceiveModalState({ type: null, line: null });
  };


  // Unified modal submit handler
  const handleReceiveModalSubmit = (data: any) => {
    if (receiveModalState.type === 'incident') {
      updateLineIncidentMutation.mutate(data);
    } else {
      receiveLineMutation.mutate(data);
    }
  };

  // Utility functions moved to components

  // Helper function to get visual status (considers line incidents)
  const getVisualStatus = (order: SupplierOrder): string => {
    // If the order has lines and any line has incident status, show as incident
    if (order.order_lines && order.order_lines.some(line => line.line_status === 'incident')) {
      return 'incident';
    }
    
    // Otherwise, return the actual order status
    return order.status;
  };

  // Handlers for filter changes
  const handleClearFilters = () => {
    setFilterByStatus("");
    setFilterBySupplier("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Pedidos a Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          <Text>Cargando pedidos...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Pedidos a Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-red-500">Error al cargar los pedidos</Text>
        </div>
      </Container>
    );
  }

  const orders: SupplierOrder[] = ordersData?.orders || [];
  const suppliers: Supplier[] = suppliersData?.suppliers || [];
  const selectedOrderLines: SupplierOrderLine[] = orderLinesData?.lines || [];
  const products: any[] = productsData?.products || [];
  const locations: any[] = locationsData?.stock_locations || [];

  // Filtros
  const filteredOrders = orders.filter((order) => {
    // Use visual status for filtering instead of real status
    const visualStatus = getVisualStatus(order);
    const matchesStatus = !filterByStatus || visualStatus === filterByStatus;
    const matchesSupplier = !filterBySupplier || order.supplier_id === filterBySupplier;
    const matchesSearch = !searchTerm.trim() || 
      order.display_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.reference && order.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSupplier && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);


  // Helper para obtener el nombre del usuario actual
  const getCurrentUserName = (): string => {
    if (!currentUserData?.user) return "Usuario no identificado";
    const user = currentUserData.user;
    return user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.email;
  };

  // Show ReceiveModal when needed
  if (receiveModalState.type && receiveModalState.line) {
    return (
      <ReceiveModal
        type={receiveModalState.type}
        line={receiveModalState.line}
        onClose={closeReceiveModal}
        onSubmit={handleReceiveModalSubmit}
        isLoading={receiveModalState.type === 'incident' ? updateLineIncidentMutation.isPending : receiveLineMutation.isPending}
        getCurrentUserName={getCurrentUserName}
      />
    );
  }

  // Form views

  // Vista detalle de pedido
  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        orderLines={selectedOrderLines}
        isLoadingLines={isLoadingLines}
        validStatuses={validStatuses}
        updateStatusMutation={updateStatusMutation}
        onBack={() => setSelectedOrder(null)}
        onReceiveItems={handleReceiveItems}
        onCompleteReceive={handleCompleteReceive}
        onIncidentModal={handleIncidentModal}
        updateLineIncidentMutation={updateLineIncidentMutation}
        receiveLineMutation={receiveLineMutation}
        getVisualStatus={getVisualStatus}
      />
    );
  }

  // Formulario de creación de pedido
  if (showCreateForm) {
    return (
      <CreateOrderForm
        suppliers={suppliers}
        stockLocations={locations}
        onCancel={() => { 
          setShowCreateForm(false); 
          resetOrderForm(); 
        }}
        onSuccess={() => {
          setShowCreateForm(false);
          resetOrderForm();
        }}
      />
    );
  }

  if (editingOrder) {
    // Use specific lines for the editing order
    const orderLines = editingOrderLinesData?.lines || [];
    const editingOrderWithLines = {
      ...editingOrder,
      lines: orderLines
    };
    
    console.log("📦 Found", orderLines.length, "lines for order", editingOrder.display_id);

    if (isLoadingEditingLines) {
      return (
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Cargando pedido...</Heading>
          </div>
          <div className="px-6 py-8">
            <Text>Cargando datos del pedido para edición...</Text>
          </div>
        </Container>
      );
    }

    return (
      <CreateOrderForm
        suppliers={suppliers}
        stockLocations={locations}
        editingOrder={editingOrderWithLines}
        onCancel={() => { 
          setEditingOrder(null); 
          resetOrderForm(); 
        }}
        onSuccess={() => {
          setEditingOrder(null);
          resetOrderForm();
        }}
      />
    );
  }

  // Vista principal de listado
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Pedidos a Proveedores</Heading>
        <div className="flex items-center gap-2">
          <Badge size="small">
            {filteredOrders.length}{" "}
            {filteredOrders.length === orders.length ? "pedidos" : `de ${orders.length} pedidos`}
          </Badge>
          <Button variant="primary" size="small" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      <OrderFilters
        filterByStatus={filterByStatus}
        filterBySupplier={filterBySupplier}
        searchTerm={searchTerm}
        suppliers={suppliers}
        onFilterByStatus={setFilterByStatus}
        onFilterBySupplier={setFilterBySupplier}
        onSearchTerm={setSearchTerm}
        onClearFilters={handleClearFilters}
      />

      <div className="px-6 py-8">
        {paginatedOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Text className="text-gray-500">
              {filteredOrders.length === 0 && (filterByStatus || filterBySupplier || searchTerm)
                ? "No se encontraron pedidos que coincidan con los filtros"
                : "No hay pedidos registrados todavía"}
            </Text>
            {filteredOrders.length === 0 && !filterByStatus && !filterBySupplier && !searchTerm && (
              <Button variant="primary" size="small" className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                Crear primer pedido
              </Button>
            )}
          </div>
        ) : (
          <OrdersTable
            orders={paginatedOrders}
            onViewOrder={setSelectedOrder}
            onEditOrder={setEditingOrder}
            onConfirmOrder={(orderId) => updateStatusMutation.mutate({ orderId, status: "confirmed" })}
            isConfirming={updateStatusMutation.isPending}
            getVisualStatus={getVisualStatus}
          />
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="pedidos"
          />
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Pedidos a Proveedores",
  icon: Package,
});

export default SupplierOrdersPage;
