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
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Calendar,
  Trash2,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { sdk } from "../../lib/sdk";

type Supplier = {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  is_active: boolean;
};

type SupplierOrderLine = {
  id: string;
  product_id: string;
  product_variant_id?: string;
  product_title: string;
  product_thumbnail?: string;
  supplier_sku?: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_pending: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_price: number;
  line_status: string;
  received_at?: string;
  received_by?: string;
  reception_notes?: string;
};

type SupplierOrder = {
  id: string;
  display_id: string;
  supplier_id: string;
  supplier: Supplier;
  order_type: "supplier" | "transfer"; // NUEVO CAMPO
  status: string;
  order_date: string;
  expected_delivery_date?: string;
  confirmed_at?: string;
  shipped_at?: string;
  received_at?: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  currency_code: string;
  destination_location_id?: string;
  destination_location_name?: string;
  source_location_id?: string; // NUEVO CAMPO
  source_location_name?: string; // NUEVO CAMPO
  reference?: string;
  created_by?: string;
  received_by?: string;
  notes?: string;
  order_lines?: SupplierOrderLine[];
  created_at: string;
  updated_at: string;
};

const SupplierOrdersPage = () => {
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [filterByStatus, setFilterByStatus] = useState<string>("");
  const [filterBySupplier, setFilterBySupplier] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showReceiveModal, setShowReceiveModal] = useState<SupplierOrderLine | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState<number>(0);
  const [receiveNotes, setReceiveNotes] = useState<string>("");
  
  const [showCompleteReceiveModal, setShowCompleteReceiveModal] = useState<SupplierOrderLine | null>(null);
  const [completeReceiveNotes, setCompleteReceiveNotes] = useState<string>("");
  
  const [showIncidentModal, setShowIncidentModal] = useState<SupplierOrderLine | null>(null);
  const [incidentNotes, setIncidentNotes] = useState<string>("");
  
  const itemsPerPage = 15;
  const queryClient = useQueryClient();

  // Query para obtener estados válidos de un pedido
  const { data: validStatuses } = useQuery({
    queryKey: ['valid-statuses', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return null;
      const response = await sdk.client.fetch(`/admin/suppliers/orders/${selectedOrder.id}/valid-statuses`);
      return response;
    },
    enabled: !!selectedOrder?.id
  });

  // Formulario de creación de pedido
  const [orderFormData, setOrderFormData] = useState({
    supplier_id: "",
    expected_delivery_date: "",
    destination_location_id: "",
    reference: "",
    notes: "",
    created_by: "",
  });

  const [orderLines, setOrderLines] = useState<Partial<SupplierOrderLine>[]>([]);
  const [globalTaxRate, setGlobalTaxRate] = useState(21); // IVA global por defecto 21%
  
  // Estados para búsqueda de productos
  const [productSearchTerms, setProductSearchTerms] = useState<{[key: number]: string}>({});
  const [showProductDropdowns, setShowProductDropdowns] = useState<{[key: number]: boolean}>({});
  const [autocompletedPrices, setAutocompletedPrices] = useState<{[key: number]: { display_id: string, date: string }}>({});

  // Query para obtener pedidos
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ orders: SupplierOrder[] }>({
    queryKey: ["supplier-orders"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/suppliers/orders?limit=1000", {
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

  // Mutation para crear pedido
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      // Crear el pedido primero
      const orderResponse = await sdk.client.fetch(`/admin/suppliers/${data.supplier_id}/orders`, {
        method: "POST",
        body: {
          expected_delivery_date: data.expected_delivery_date,
          destination_location_id: data.destination_location_id || "default",
          reference: data.reference,
          notes: data.notes,
          created_by: data.created_by, // Quién realiza el pedido
        },
      });

      // Si hay líneas de pedido, agregarlas
      if (orderLines.length > 0) {
        for (const line of orderLines) {
          if (line.product_title && line.quantity_ordered) {
            const lineData = {
              product_id: line.product_id, // ✅ CRÍTICO: Incluir product_id para productos de Medusa
              product_title: line.product_title,
              product_thumbnail: line.product_thumbnail,
              supplier_sku: line.supplier_sku,
              quantity_ordered: line.quantity_ordered,
              unit_price: line.unit_price || 0,
            };
            
            console.log(`🔍 DEBUG Frontend - Línea original del estado:`, JSON.stringify(line, null, 2));
            console.log(`🔍 DEBUG Frontend - Enviando línea:`, JSON.stringify(lineData, null, 2));
            console.log(`🔍 DEBUG Frontend - product_id específico:`, line.product_id);
            console.log(`🔍 DEBUG Frontend - product_id es vacío?:`, !line.product_id || line.product_id.trim() === '');
            console.log(`🔍 DEBUG Frontend - product_thumbnail en estado:`, line.product_thumbnail);
            console.log(`🔍 DEBUG Frontend - product_thumbnail en lineData:`, lineData.product_thumbnail);
            //@ts-ignore
            await sdk.client.fetch(`/admin/suppliers/orders/${orderResponse.order.id}/lines`, {
              method: "POST",
              body: lineData,
            });
          }
        }
      }

      return orderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      setShowCreateForm(false);
      resetOrderForm();
    },
    onError: (error: any) => {
      alert("Error al crear el pedido: " + error.message);
    }
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
      
      setShowIncidentModal(null);
      setIncidentNotes("");
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
      setShowReceiveModal(null);
      setReceiveQuantity(0);
      setReceiveNotes("");
      
      setShowCompleteReceiveModal(null);
      setCompleteReceiveNotes("");
    },
    onError: (error: any) => {
      alert("Error al recepcionar: " + error.message);
    }
  });

  const resetOrderForm = () => {
    setOrderFormData({
      supplier_id: "",
      expected_delivery_date: "",
      destination_location_id: "",
      reference: "",
      notes: "",
      created_by: "",
    });
    setOrderLines([]);
    setGlobalTaxRate(21); // Reset IVA global a 21%
    setProductSearchTerms({});
    setShowProductDropdowns({});
    setAutocompletedPrices({});
  };

  const addOrderLine = () => {
    setOrderLines([...orderLines, {
      product_id: "", // ✅ CRÍTICO: Incluir product_id para productos de Medusa
      product_title: "",
      supplier_sku: "",
      quantity_ordered: 1,
      unit_price: 0,
      tax_rate: globalTaxRate, // Usar IVA global seleccionado
      discount_rate: 0, // Sin descuento por defecto
    }]);
  };

  const removeOrderLine = (index: number) => {
    setOrderLines(orderLines.filter((_, i) => i !== index));
    
    // Limpiar estados relacionados con esta línea
    const newProductSearchTerms = { ...productSearchTerms };
    const newShowDropdowns = { ...showProductDropdowns };
    const newAutocompletedPrices = { ...autocompletedPrices };
    
    delete newProductSearchTerms[index];
    delete newShowDropdowns[index];
    delete newAutocompletedPrices[index];
    
    // Reindexar los índices superiores
    for (let i = index + 1; i < orderLines.length; i++) {
      if (newProductSearchTerms[i]) {
        newProductSearchTerms[i - 1] = newProductSearchTerms[i];
        delete newProductSearchTerms[i];
      }
      if (newShowDropdowns[i]) {
        newShowDropdowns[i - 1] = newShowDropdowns[i];
        delete newShowDropdowns[i];
      }
      if (newAutocompletedPrices[i]) {
        newAutocompletedPrices[i - 1] = newAutocompletedPrices[i];
        delete newAutocompletedPrices[i];
      }
    }
    
    setProductSearchTerms(newProductSearchTerms);
    setShowProductDropdowns(newShowDropdowns);
    setAutocompletedPrices(newAutocompletedPrices);
  };

  const updateOrderLine = (index: number, field: string, value: any) => {
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setOrderLines(newLines);
  };

  // Función para aplicar IVA global a todas las líneas existentes
  const applyGlobalTaxToAllLines = () => {
    const newLines = orderLines.map(line => ({
      ...line,
      tax_rate: globalTaxRate
    }));
    setOrderLines(newLines);
  };

  // Función helper para calcular total con descuento e IVA
  const calculateLineTotal = (line: Partial<SupplierOrderLine>) => {
    const quantity = line.quantity_ordered || 0;
    const unitPrice = line.unit_price || 0;
    const discountRate = line.discount_rate || 0;
    const taxRate = line.tax_rate || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discountRate / 100);
    const discountedPrice = subtotal - discountAmount;
    const taxAmount = discountedPrice * (taxRate / 100);
    const total = discountedPrice + taxAmount;

    return total;
  };

  // Función para calcular totales del pedido
  const calculateOrderTotals = () => {
    const subtotal = orderLines.reduce((sum, line) => sum + ((line.quantity_ordered || 0) * (line.unit_price || 0)), 0);
    const totalDiscounts = orderLines.reduce((sum, line) => {
      const lineSubtotal = (line.quantity_ordered || 0) * (line.unit_price || 0);
      const discountAmount = lineSubtotal * ((line.discount_rate || 0) / 100);
      return sum + discountAmount;
    }, 0);
    const subtotalAfterDiscounts = subtotal - totalDiscounts;
    const totalTax = orderLines.reduce((sum, line) => {
      const lineSubtotal = (line.quantity_ordered || 0) * (line.unit_price || 0);
      const discountAmount = lineSubtotal * ((line.discount_rate || 0) / 100);
      const discountedPrice = lineSubtotal - discountAmount;
      const taxAmount = discountedPrice * ((line.tax_rate || 0) / 100);
      return sum + taxAmount;
    }, 0);
    const total = subtotalAfterDiscounts + totalTax;

    return { subtotal, totalDiscounts, subtotalAfterDiscounts, totalTax, total };
  };

  // Funciones helper para búsqueda de productos (similar a product-suppliers)
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.title || productId;
  };

  const handleProductSearch = (index: number, searchTerm: string) => {
    setProductSearchTerms({ ...productSearchTerms, [index]: searchTerm });
    setShowProductDropdowns({ ...showProductDropdowns, [index]: searchTerm.length > 0 });
  };

  const selectProduct = async (index: number, product: any) => {
    console.log(`🔍 DEBUG selectProduct - Seleccionando:`, { id: product.id, title: product.title });
    console.log(`🔍 DEBUG selectProduct - Producto completo:`, JSON.stringify(product, null, 2));
    console.log(`🔍 DEBUG selectProduct - product.thumbnail específico:`, product.thumbnail);
    console.log(`🔍 DEBUG selectProduct - thumbnail type:`, typeof product.thumbnail);
    
    // Actualizar múltiples campos en una sola operación para evitar problemas de concurrencia
    const newLines = [...orderLines];
    newLines[index] = { 
      ...newLines[index], 
      product_id: product.id,
      product_title: product.title,
      product_thumbnail: product.thumbnail
    };
    
    console.log(`🔍 DEBUG selectProduct - Línea actualizada:`, newLines[index]);
    console.log(`🔍 DEBUG selectProduct - product_thumbnail asignado:`, newLines[index].product_thumbnail);
    
    // Intentar obtener último precio si hay un proveedor seleccionado
    if (orderFormData.supplier_id) {
      try {
        console.log(`💰 Buscando último precio para producto ${product.id} del proveedor ${orderFormData.supplier_id}`);
        const response = await fetch(`/admin/suppliers/${orderFormData.supplier_id}/products/${product.id}/last-price`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log(`✅ Precio anterior encontrado:`, data.data);
            
            // Autocompletar con los valores anteriores
            newLines[index] = {
              ...newLines[index],
              unit_price: data.data.last_price,
              tax_rate: data.data.tax_rate || globalTaxRate,
              discount_rate: data.data.discount_rate || 0,
            };
            
            // Guardar información de autocompletado para mostrar al usuario
            setAutocompletedPrices({
              ...autocompletedPrices,
              [index]: {
                display_id: data.data.last_order_display_id,
                date: new Date(data.data.last_order_date).toLocaleDateString()
              }
            });
            
            console.log(`💡 Precios autocompletados desde último pedido ${data.data.last_order_display_id}`);
          }
        } else {
          console.log(`ℹ️ No se encontró historial de precios para este producto`);
        }
      } catch (error) {
        console.warn(`⚠️ Error obteniendo último precio:`, error);
        // Continuar sin autocompletar si hay error
      }
    }
    
    setOrderLines(newLines);
    setProductSearchTerms({ ...productSearchTerms, [index]: product.title });
    setShowProductDropdowns({ ...showProductDropdowns, [index]: false });
    
    // Usar setTimeout para ver el estado actualizado después del re-render
    setTimeout(() => {
      console.log(`🔍 DEBUG selectProduct - orderLines después de actualizar:`, newLines[index]);
      console.log(`🔍 DEBUG selectProduct - Estado completo de orderLines:`, newLines);
    }, 100);
  };

  const getFilteredProducts = (index: number) => {
    const searchTerm = productSearchTerms[index] || "";
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    console.log("🔍 Buscando:", searchTerm, "en", products.length, "productos");
    
    const filtered = products.filter(product => 
      product.title && product.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 15); // Mostrar hasta 15 resultados
    
    console.log("✨ Encontrados:", filtered.length, "productos");
    if (filtered.length > 0) {
      console.log("📋 Primeros resultados:", filtered.slice(0, 3).map(p => ({ id: p.id, title: p.title })));
    }
    
    return filtered;
  };

  const handleReceiveItems = (line: SupplierOrderLine) => {
    const pendingQty = line.quantity_pending || (line.quantity_ordered - line.quantity_received);
    setShowReceiveModal(line);
    setReceiveQuantity(pendingQty);
    setReceiveNotes("");
  };

  const handleCompleteReceive = (line: SupplierOrderLine) => {
    setShowCompleteReceiveModal(line);
    setCompleteReceiveNotes("");
  };

  const handleIncidentModal = (line: SupplierOrderLine) => {
    setShowIncidentModal(line);
    setIncidentNotes("");
  };


  const submitReceive = () => {
    if (!showReceiveModal || receiveQuantity <= 0) return;
    
    receiveLineMutation.mutate({
      lineId: showReceiveModal.id,
      data: {
        quantity_received: receiveQuantity,
        reception_notes: receiveNotes,
        received_by: getCurrentUserName(),
      }
    });
  };

  const submitCompleteReceive = () => {
    if (!showCompleteReceiveModal) return;
    
    const pendingQty = showCompleteReceiveModal.quantity_pending || 
                      (showCompleteReceiveModal.quantity_ordered - showCompleteReceiveModal.quantity_received);
    
    receiveLineMutation.mutate({
      lineId: showCompleteReceiveModal.id,
      data: {
        quantity_received: pendingQty,
        reception_notes: completeReceiveNotes || "Recepción completa",
        received_by: getCurrentUserName(),
      },
    });
  };

  const submitIncident = () => {
    if (!showIncidentModal) return;
    
    const isIncident = showIncidentModal.line_status === "incident";
    
    updateLineIncidentMutation.mutate({
      lineId: showIncidentModal.id,
      hasIncident: !isIncident,
      notes: !isIncident ? incidentNotes : "",
      userId: getCurrentUserName()
    });
  };

  // Función para obtener estados válidos de transición
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
      label: `${statusLabels[currentStatus]} (actual)`,
      disabled: true
    }];

    if (validNextStatuses && validNextStatuses.length > 0) {
      validNextStatuses.forEach(status => {
        options.push({
          value: status,
          label: statusLabels[status] || status,
          disabled: false
        });
      });
    }

    return options;
  };

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
      draft: <Clock className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      partially_received: <Package className="w-4 h-4" />,
      received: <CheckCircle className="w-4 h-4" />,
      incident: <AlertTriangle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />;
  };

  // Funciones helper para transferencias
  const isTransferOrder = (order: SupplierOrder): boolean => {
    return order.order_type === "transfer";
  };

  const getOrderTypeIcon = (order: SupplierOrder) => {
    return isTransferOrder(order) ? 
      <ArrowUpRight className="w-4 h-4 text-blue-600" title="Transferencia Interna" /> :
      <Package className="w-4 h-4 text-gray-600" title="Pedido a Proveedor" />;
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
  const lines: SupplierOrderLine[] = orderLinesData?.lines || [];
  const products: any[] = productsData?.products || [];
  const locations: any[] = locationsData?.stock_locations || [];

  // Filtros
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = !filterByStatus || order.status === filterByStatus;
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

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterByStatus, filterBySupplier, searchTerm]);

  // Auto-completar el campo "created_by" con el usuario logueado
  useEffect(() => {
    if (currentUserData?.user && !orderFormData.created_by) {
      const user = currentUserData.user;
      const userName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`
        : user.email;
      setOrderFormData(prev => ({ ...prev, created_by: userName }));
    }
  }, [currentUserData, orderFormData.created_by]);

  // Helper para obtener el nombre del usuario actual
  const getCurrentUserName = (): string => {
    if (!currentUserData?.user) return "Usuario no identificado";
    const user = currentUserData.user;
    return user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.email;
  };

  // Modal de recepción
  if (showReceiveModal) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => setShowReceiveModal(null)}>
              ← Volver
            </Button>
            <Heading level="h2">📦 Recepción Parcial</Heading>
          </div>
        </div>

        <div className="px-6 py-8 max-w-2xl">
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-300 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img className="w-20 h-20 rounded-xl" src={showReceiveModal.product_thumbnail} />
                  <Text className="font-medium dark:text-gray-600">{showReceiveModal.product_title}</Text>
                </div>
                {showReceiveModal.supplier_sku && (
                  <Text size="small" className="text-gray-600">Ref: {showReceiveModal.supplier_sku}</Text>
                )}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Text size="small" className="text-gray-600">Pedido</Text>
                    <Text className="font-medium">{showReceiveModal.quantity_ordered}</Text>
                  </div>
                  <div>
                    <Text size="small" className="text-gray-600">Recibido</Text>
                    <Text className="font-medium">{showReceiveModal.quantity_received}</Text>
                  </div>
                  <div>
                    <Text size="small" className="text-gray-600">Pendiente</Text>
                    <Text className="font-medium text-orange-600">{showReceiveModal.quantity_pending || (showReceiveModal.quantity_ordered - showReceiveModal.quantity_received)}</Text>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cantidad a recepcionar *</label>
              <input
                type="number"
                min="1"
                max={showReceiveModal.quantity_pending || (showReceiveModal.quantity_ordered - showReceiveModal.quantity_received)}
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <Text size="small" className="text-gray-500 mt-1">
                Máximo: {showReceiveModal.quantity_pending || (showReceiveModal.quantity_ordered - showReceiveModal.quantity_received)} unidades
              </Text>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <label className="block text-sm font-bold text-yellow-800 mb-2">
                    📝 Notas de recepción parcial
                  </label>
                  <Text size="small" className="text-yellow-700 mb-3">
                    Describe el estado de la mercancía, motivo de la recepción parcial, incidencias encontradas, etc.
                  </Text>
                  <textarea
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="Ejemplo: 'Recibidas 5 de 10 unidades. Resto pendiente por disponibilidad del proveedor. Estado: perfecto.'"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                onClick={submitReceive}
                disabled={receiveLineMutation.isPending || receiveQuantity <= 0 || receiveQuantity > (showReceiveModal.quantity_pending || (showReceiveModal.quantity_ordered - showReceiveModal.quantity_received))}
                className="bg-green-600 hover:bg-green-700"
              >
                {receiveLineMutation.isPending ? (
                  <>
                    <Package className="w-4 h-4 mr-2 animate-pulse" />
                    Recepcionando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Recepción
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={() => setShowReceiveModal(null)}>
                Cancelar
              </Button>
              
              {(() => {
                const maxQty = showReceiveModal.quantity_pending || (showReceiveModal.quantity_ordered - showReceiveModal.quantity_received);
                return (receiveQuantity <= 0 || receiveQuantity > maxQty) && (
                  <Text size="small" className="text-red-600 ml-2">
                    Cantidad debe ser entre 1 y {maxQty}
                  </Text>
                );
              })()}
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Modal de recepción completa
  if (showCompleteReceiveModal) {
    const pendingQty = showCompleteReceiveModal.quantity_pending || (showCompleteReceiveModal.quantity_ordered - showCompleteReceiveModal.quantity_received);
    
    return (
      <Container className="divide-y p-0">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <Button variant="secondary" size="small" onClick={() => setShowCompleteReceiveModal(null)}>
                    ← Volver
                  </Button>
                  <Heading level="h2">Recepción Completa</Heading>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800 mb-2">Recepción Completa de Mercancía</h3>
                        <Text className="text-green-700 mb-4">
                          Vas a recepcionar <strong>TODAS las unidades pendientes</strong> de este producto. 
                          Esta acción marcará la línea como completamente recibida.
                        </Text>
                        
                        <div className="bg-white border border-green-200 p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <img className="w-20 h-20 rounded-xl" src={showCompleteReceiveModal.product_thumbnail} />
                            <Text className="font-medium">{showCompleteReceiveModal.product_title}</Text>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Text size="small" className="text-gray-600">Pedido</Text>
                              <Text className="font-medium">{showCompleteReceiveModal.quantity_ordered}</Text>
                            </div>
                            <div>
                              <Text size="small" className="text-gray-600">Recibido</Text>
                              <Text className="font-medium">{showCompleteReceiveModal.quantity_received}</Text>
                            </div>
                            <div>
                              <Text size="small" className="text-gray-600">A Recepcionar</Text>
                              <Text className="font-bold text-green-600 text-lg">{pendingQty}</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notas de recepción (opcional)</label>
                    <textarea
                      value={completeReceiveNotes}
                      onChange={(e) => setCompleteReceiveNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Ejemplo: 'Mercancía recibida en perfecto estado. Entrega completa sin incidencias.'"
                    />
                    <Text size="small" className="text-gray-500 mt-1">
                      Si no se especifican notas, se guardará como "Recepción completa"
                    </Text>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button
                      onClick={submitCompleteReceive}
                      disabled={receiveLineMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {receiveLineMutation.isPending ? (
                        <>
                          <Package className="w-4 h-4 mr-2 animate-pulse" />
                          Recepcionando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Recepción Completa ({pendingQty} unidades)
                        </>
                      )}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowCompleteReceiveModal(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
      </Container>
    );
  }

  // Modal de incidencia
  if (showIncidentModal) {
    const isCurrentlyIncident = showIncidentModal.line_status === "incident";
    
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => setShowIncidentModal(null)}>
              ← Volver
            </Button>
            <Heading level="h2">
              {isCurrentlyIncident ? "Quitar Incidencia" : "Marcar Incidencia"}
            </Heading>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-6">
            <div className={`${isCurrentlyIncident ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border p-4 rounded-lg`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-6 h-6 ${isCurrentlyIncident ? 'text-blue-600' : 'text-red-600'} mt-1`} />
                <div className="flex-1">
                  <h3 className={`font-semibold ${isCurrentlyIncident ? 'text-blue-800' : 'text-red-800'} mb-2`}>
                    {isCurrentlyIncident ? "Resolver Incidencia" : "Reportar Incidencia"}
                  </h3>
                  <Text className={`${isCurrentlyIncident ? 'text-blue-700' : 'text-red-700'} mb-4`}>
                    {isCurrentlyIncident 
                      ? "Esta línea está marcada como incidencia. ¿Deseas quitarle el estado de incidencia?"
                      : "Vas a marcar esta línea como incidencia. Describe el problema encontrado."
                    }
                  </Text>
                  
                  <div className={`bg-white ${isCurrentlyIncident ? 'border-blue-200' : 'border-red-200'} border p-4 rounded-lg`}>
                    <div className="flex items-center gap-3 mb-3">
                      <img className="w-20 h-20 rounded-xl" src={showIncidentModal.product_thumbnail} />
                      <Text className="font-medium">{showIncidentModal.product_title}</Text>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Text size="small" className="text-gray-600">Pedido</Text>
                        <Text className="font-medium">{showIncidentModal.quantity_ordered}</Text>
                      </div>
                      <div>
                        <Text size="small" className="text-gray-600">Recibido</Text>
                        <Text className="font-medium">{showIncidentModal.quantity_received}</Text>
                      </div>
                      <div>
                        <Text size="small" className="text-gray-600">Estado</Text>
                        <Badge className={`${isCurrentlyIncident ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`} size="small">
                          {isCurrentlyIncident ? "Con Incidencia" : showIncidentModal.line_status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Mostrar notas existentes si hay incidencia */}
                    {isCurrentlyIncident && showIncidentModal.reception_notes && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <Text size="small" className="text-red-600 font-medium">Notas de la incidencia actual:</Text>
                        <Text size="small" className="text-red-700 mt-1">"{showIncidentModal.reception_notes}"</Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Campo de notas solo si NO es incidencia actualmente */}
            {!isCurrentlyIncident && (
              <div>
                <label className="block text-sm font-medium mb-2">Notas de la incidencia *</label>
                <textarea
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Describe el problema: mercancía dañada, cantidad incorrecta, producto equivocado, etc."
                  required
                />
                <Text size="small" className="text-red-600 mt-1">
                  Las notas son obligatorias para reportar una incidencia
                </Text>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                onClick={submitIncident}
                disabled={updateLineIncidentMutation.isPending || (!isCurrentlyIncident && !incidentNotes.trim())}
                className={`${isCurrentlyIncident ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {updateLineIncidentMutation.isPending ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2 animate-pulse" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {isCurrentlyIncident ? "Quitar Incidencia" : "Marcar como Incidencia"}
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={() => setShowIncidentModal(null)}>
                Cancelar
              </Button>
              
              {/* Mensaje de validación */}
              {!isCurrentlyIncident && !incidentNotes.trim() && (
                <Text size="small" className="text-red-600 ml-2">
                  Las notas son requeridas
                </Text>
              )}
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Vista detalle de pedido
  if (selectedOrder) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => setSelectedOrder(null)}>
              ← Volver
            </Button>
            <Heading level="h2">Pedido {selectedOrder.display_id}</Heading>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(selectedOrder.status)} size="small">
              {getStatusIcon(selectedOrder.status)}
              {getStatusLabel(selectedOrder.status)}
            </Badge>
            {validStatuses && validStatuses.validNextStatuses && validStatuses.validNextStatuses.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    updateStatusMutation.mutate({ orderId: selectedOrder.id, status: e.target.value });
                  }
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
                disabled={updateStatusMutation.isPending}
              >
                <option value="">Cambiar estado...</option>
              
                {getValidStatusOptions(selectedOrder.status, validStatuses.validNextStatuses).map((option) => (
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
                  <Text className="font-medium">{selectedOrder.supplier.name}</Text>
                  <Text size="small" className="text-gray-500">{selectedOrder.supplier.legal_name}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600">Referencia Externa</Text>
                  <Text className="font-medium">{selectedOrder.reference || "-"}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600">Fecha de Pedido</Text>
                  <Text className="font-medium">{formatDate(selectedOrder.order_date)}</Text>
                </div>
                {selectedOrder.expected_delivery_date && (
                  <div>
                    <Text size="small" className="text-gray-600">Entrega Esperada</Text>
                    <Text className="font-medium">{formatDate(selectedOrder.expected_delivery_date)}</Text>
                  </div>
                )}
                <div>
                  <Text size="small" className="text-gray-600">Realizado por</Text>
                  <Text className="font-medium">{selectedOrder.created_by || "No especificado"}</Text>
                </div>
                {selectedOrder.received_by && (
                  <div>
                    <Text size="small" className="text-gray-600">Recepcionado por</Text>
                    <Text className="font-medium">{selectedOrder.received_by}</Text>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">Totales</Heading>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text>Subtotal:</Text>
                  <Text className="font-medium">{formatCurrency(selectedOrder.subtotal, selectedOrder.currency_code)}</Text>
                </div>
                {selectedOrder.discount_total > 0 && (
                  <div className="flex justify-between">
                    <Text>Descuentos:</Text>
                    <Text className="font-medium text-green-600">-{formatCurrency(selectedOrder.discount_total, selectedOrder.currency_code)}</Text>
                  </div>
                )}
                {selectedOrder.tax_total > 0 && (
                  <div className="flex justify-between">
                    <Text>Impuestos:</Text>
                    <Text className="font-medium">{formatCurrency(selectedOrder.tax_total, selectedOrder.currency_code)}</Text>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <Text>Total:</Text>
                  <Text>{formatCurrency(selectedOrder.total, selectedOrder.currency_code)}</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline del Pedido */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Estado del Pedido</Heading>
            <div className="flex items-center gap-8 overflow-x-auto py-4">
              <div className={`flex flex-col items-center gap-2 ${
                selectedOrder.created_at ? "text-blue-600" : "text-gray-400"
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedOrder.created_at ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <Text size="small">Creado</Text>
                {selectedOrder.created_at && <Text size="small" className="text-gray-500">{formatDateTime(selectedOrder.created_at)}</Text>}
              </div>
              
              <div className="flex-1 border-t-2 border-gray-300"></div>
              
              <div className={`flex flex-col items-center gap-2 ${
                selectedOrder.confirmed_at ? "text-blue-600" : "text-gray-400"
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedOrder.confirmed_at ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <Text size="small">Confirmado</Text>
                {selectedOrder.confirmed_at && <Text size="small" className="text-gray-500">{formatDateTime(selectedOrder.confirmed_at)}</Text>}
              </div>
              
              <div className="flex-1 border-t-2 border-gray-300"></div>
              
              <div className={`flex flex-col items-center gap-2 ${
                selectedOrder.shipped_at ? "text-purple-600" : "text-gray-400"
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedOrder.shipped_at ? "border-purple-600 bg-purple-50" : "border-gray-300"
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <Text size="small">Enviado</Text>
                {selectedOrder.shipped_at && <Text size="small" className="text-gray-500">{formatDateTime(selectedOrder.shipped_at)}</Text>}
              </div>
              
              <div className="flex-1 border-t-2 border-gray-300"></div>
              
              <div className={`flex flex-col items-center gap-2 ${
                selectedOrder.received_at ? "text-green-600" : "text-gray-400"
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedOrder.received_at ? "border-green-600 bg-green-50" : "border-gray-300"
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <Text size="small">Recibido</Text>
                {selectedOrder.received_at && <Text size="small" className="text-gray-500">{formatDateTime(selectedOrder.received_at)}</Text>}
              </div>
            </div>
          </div>

          {/* Líneas del Pedido */}
          <div className="space-y-4">
            {/* <div className="flex items-center justify-between">
              <Heading level="h3" className="text-lg">Líneas del Pedido</Heading>
              {selectedOrder.status === "draft" && (
                <Button variant="secondary" size="small" onClick={addOrderLine}>
                  <Plus className="w-4 h-4" />
                  Agregar Línea
                </Button>
              )}
            </div> */}
            
            {isLoadingLines ? (
              <Text>Cargando líneas...</Text>
            ) : lines.length > 0 ? (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Producto</Table.HeaderCell>
                    <Table.HeaderCell>Ref. Proveedor</Table.HeaderCell>
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
                  {lines.map((line) => {
                    console.log(`🔍 DEBUG Line ${line.id}:`, {
                      product_title: line.product_title,
                      product_thumbnail: line.product_thumbnail,
                      thumbnail_type: typeof line.product_thumbnail,
                      thumbnail_length: line.product_thumbnail?.length
                    });
                    return (
                    <Table.Row key={line.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <img className="w-20 h-20 rounded-xl" src={line.product_thumbnail} />
                          <Text className="font-medium">{line.product_title}</Text>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small" className="text-gray-500">{line.supplier_sku || "-"}</Text>
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
                        <Text>{formatCurrency(line.unit_price, selectedOrder.currency_code)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="font-medium">{formatCurrency(line.total_price, selectedOrder.currency_code)}</Text>
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
                          {selectedOrder.status !== "cancelled" && (
                            <>
                              {/* Marcar como incidencia */}
                              <Button
                                variant={line.line_status === "incident" ? "primary" : "secondary"}
                                size="small"
                                onClick={() => handleIncidentModal(line)}
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
                                  onClick={() => handleCompleteReceive(line)}
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
                                  onClick={() => handleReceiveItems(line)}
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
                {selectedOrder.status === "draft" && (
                  <Button variant="secondary" size="small" className="mt-2" onClick={addOrderLine}>
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
  }

  // Formulario de creación de pedido
  if (showCreateForm) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => { setShowCreateForm(false); resetOrderForm(); }}>
              ← Volver
            </Button>
            <Heading level="h2">Crear Nuevo Pedido</Heading>
          </div>
        </div>

        <div className="px-6 py-8">
          <form onSubmit={(e) => { e.preventDefault(); createOrderMutation.mutate(orderFormData); }} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Heading level="h3" className="text-lg">Información del Pedido</Heading>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Proveedor *</label>
                  <select
                    value={orderFormData.supplier_id}
                    onChange={(e) => setOrderFormData({ ...orderFormData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
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
                    value={orderFormData.reference}
                    onChange={(e) => setOrderFormData({ ...orderFormData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de referencia del proveedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de Entrega Esperada</label>
                  <input
                    type="date"
                    value={orderFormData.expected_delivery_date}
                    onChange={(e) => setOrderFormData({ ...orderFormData, expected_delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Realizado por *</label>
                  <input
                    type="text"
                    value={orderFormData.created_by}
                    className="w-full px-3 py-2  border border-gray-300 rounded-lg text-gray-700 dark:text-white cursor-not-allowed"
                    placeholder="Cargando usuario..."
                    disabled
                    readOnly
                  />
                  <Text size="small" className="text-gray-500 mt-1">
                    Usuario logueado automáticamente
                  </Text>
                </div>
              </div>

              <div className="space-y-4">
                <Heading level="h3" className="text-lg">Detalles de Entrega</Heading>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Ubicación de Destino *</label>
                  <select
                    value={orderFormData.destination_location_id}
                    onChange={(e) => setOrderFormData({ ...orderFormData, destination_location_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar almacén</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  <Text size="small" className="text-gray-500 mt-1">
                    Almacén donde se recibirá la mercancía
                  </Text>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notas del Pedido</label>
                  <textarea
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Instrucciones especiales, observaciones..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading level="h3" className="text-lg">Líneas del Pedido</Heading>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">IVA por defecto:</label>
                    <select
                      value={globalTaxRate}
                      onChange={(e) => setGlobalTaxRate(parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={0}>0%</option>
                      <option value={21}>21%</option>
                    </select>
                    {orderLines.length > 0 && (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="small"
                        onClick={applyGlobalTaxToAllLines}
                        className="text-xs"
                      >
                        Aplicar a todas
                      </Button>
                    )}
                  </div>
                  <Button type="button" variant="secondary" size="small" onClick={addOrderLine}>
                    <Plus className="w-4 h-4" />
                    Agregar Producto
                  </Button>
                </div>
              </div>

              {orderLines.length > 0 ? (
                <div className="space-y-4">
                  {orderLines.map((line, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-500 p-4 rounded-lg">
                      <div className="space-y-4">
                        {/* Primera fila: Producto (ocupa todo el ancho) */}
                        <div className="relative">
                          <label className="block text-sm font-medium mb-1">Producto *</label>
                          <input
                            type="text"
                            value={productSearchTerms[index] || line.product_title || ""}
                            onChange={(e) => {
                              handleProductSearch(index, e.target.value);
                              updateOrderLine(index, "product_title", e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Buscar producto por nombre..."
                            required
                          />
                          
                          {/* Dropdown de productos filtrados */}
                          {showProductDropdowns[index] && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                              {getFilteredProducts(index).length > 0 ? (
                                getFilteredProducts(index).map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => selectProduct(index, product)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  >
                                    <img className="w-20 h-20 rounded-xl" src={product.thumbnail} />
                                    <div className="font-medium text-gray-900">{product.title}</div>
                                    {/* <div className="text-gray-500 text-xs">
                                      ID: {product.id}
                                    </div> */}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No se encontraron productos para "{productSearchTerms[index] || ""}"
                                  <br />
                                  <span className="text-xs">Total productos: {products.length}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Segunda fila: Resto de campos */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">SKU Proveedor</label>
                            <input
                              type="text"
                              value={line.supplier_sku || ""}
                              onChange={(e) => updateOrderLine(index, "supplier_sku", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Código del proveedor"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Cantidad *</label>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity_ordered || 1}
                              onChange={(e) => updateOrderLine(index, "quantity_ordered", parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Precio Unit.</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.unit_price || 0}
                              onChange={(e) => {
                                updateOrderLine(index, "unit_price", parseFloat(e.target.value) || 0);
                                // Limpiar indicador de autocompletado si el usuario modifica manualmente
                                if (autocompletedPrices[index]) {
                                  const newAutocompleted = { ...autocompletedPrices };
                                  delete newAutocompleted[index];
                                  setAutocompletedPrices(newAutocompleted);
                                }
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0.00"
                            />
                            {autocompletedPrices[index] && (
                              <div className="text-xs text-blue-600 mt-1">
                                💡 Precio del pedido {autocompletedPrices[index].display_id} ({autocompletedPrices[index].date})
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">% IVA</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={line.tax_rate || 0}
                              onChange={(e) => updateOrderLine(index, "tax_rate", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="21"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">% Desc.</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={line.discount_rate || 0}
                              onChange={(e) => updateOrderLine(index, "discount_rate", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            {(line.quantity_ordered && line.unit_price) ? (
                              <div>
                                <label className="block text-sm font-medium mb-1">Total Línea</label>
                                <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm font-medium text-blue-800">
                                  {formatCurrency(calculateLineTotal(line), "EUR")}
                                </div>
                                {(line.discount_rate > 0 || line.tax_rate > 0) && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Base: {formatCurrency((line.quantity_ordered || 0) * (line.unit_price || 0), "EUR")}
                                    {line.discount_rate > 0 && (
                                      <span> | -{line.discount_rate}%</span>
                                    )}
                                    {line.tax_rate > 0 && (
                                      <span> | +{line.tax_rate}% IVA</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-8"></div>
                            )}
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="secondary"
                              size="small"
                              onClick={() => removeOrderLine(index)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {orderLines.length > 0 && (
                    <div className="bg-blue-50 dark:bg-gray-500 p-4 rounded-lg">
                      <div className="text-right space-y-2">
                        {(() => {
                          const totals = calculateOrderTotals();
                          return (
                            <>
                              <div className="text-sm text-gray-600">
                                <div>Subtotal: {formatCurrency(totals.subtotal, "EUR")}</div>
                                {totals.totalDiscounts > 0 && (
                                  <div className="text-red-600">Descuentos: -{formatCurrency(totals.totalDiscounts, "EUR")}</div>
                                )}
                                {totals.totalTax > 0 && (
                                  <div className="text-green-600">IVA: +{formatCurrency(totals.totalTax, "EUR")}</div>
                                )}
                              </div>
                              <div className="border-t pt-2">
                                <Text className="font-bold text-lg">
                                  Total Pedido: {formatCurrency(totals.total, "EUR")}
                                </Text>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <Text className="text-gray-500">No hay productos en el pedido</Text>
                  <Button type="button" variant="secondary" size="small" className="mt-2" onClick={addOrderLine}>
                    <Plus className="w-4 h-4" />
                    Agregar primer producto
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={createOrderMutation.isPending || !orderFormData.supplier_id || !orderFormData.created_by || !orderFormData.destination_location_id}
              >
                {createOrderMutation.isPending ? "Creando..." : "Crear Pedido"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowCreateForm(false); resetOrderForm(); }}
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
            <option value="draft">📝 Borradores</option>
            <option value="pending">⏳ Pendientes</option>
            <option value="confirmed">✅ Confirmados</option>
            <option value="shipped">🚚 Enviados</option>
            <option value="partially_received">📦 Parcialmente recibidos</option>
            <option value="received">✅ Recibidos</option>
            <option value="incident">🚨 Con Incidencias</option>
            <option value="cancelled">❌ Cancelados</option>
          </select>
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
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, proveedor o referencia"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm min-w-[250px]"
            />
          </div>
          {(filterByStatus || filterBySupplier || searchTerm) && (
            <button
              onClick={() => {
                setFilterByStatus("");
                setFilterBySupplier("");
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
              {paginatedOrders.map((order) => (
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
                    <Badge className={getStatusColor(order.status)} size="small">
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </Badge>
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
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                      {order.status !== "cancelled" && order.status !== "received" && (
                        <select
                          value={order.status}
                          onChange={(e) => updateStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                          className="px-2 py-1 text-xs border border-gray-300 rounded"
                          disabled={updateStatusMutation.isPending}
                        >
                          <option value="draft">Borrador</option>
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmar</option>
                          <option value="shipped">Enviado</option>
                          <option value="received">Recibido</option>
                          <option value="cancelled">Cancelar</option>
                        </select>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        {/* Paginación */}
        {filteredOrders.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Text size="small">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length} pedidos
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
  label: "Pedidos a Proveedores",
  icon: Package,
});

export default SupplierOrdersPage;