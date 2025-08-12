import { Container, Heading, Table, Badge, Text, Button } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";
import {
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
  Truck,
  ArrowUpDown,
  Calendar,
  MapPin,
  Plus,
  Download
} from "lucide-react";
import { sdk } from "../../lib/sdk";

type InventoryMovement = {
  id: string;
  movement_type: string;
  reference_id: string;
  reference_type: string;
  product_id: string;
  product_variant_id?: string;
  product_title?: string;
  from_location_id?: string;
  to_location_id?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  performed_by?: string;
  performed_at: string;
  reason?: string;
  metadata?: any;
  created_at: string;
};

const InventoryMovementsPage = () => {
  const [filterByType, setFilterByType] = useState<string>("");
  const [filterByProduct, setFilterByProduct] = useState<string>("");
  const [filterByLocation, setFilterByLocation] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  // Formulario para movimiento manual
  const [movementForm, setMovementForm] = useState({
    movement_type: "adjustment",
    product_id: "",
    product_title: "",
    from_location_id: "",
    to_location_id: "",
    quantity: 0,
    unit_cost: 0,
    reason: "",
  });

  // Query para obtener movimientos
  const {
    data: movementsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ movements: InventoryMovement[] }>({
    queryKey: ["inventory-movements", filterByType, filterByProduct, filterByLocation, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterByType) params.append("movement_type", filterByType);
      if (filterByProduct) params.append("product_id", filterByProduct);
      if (filterByLocation) params.append("location_id", filterByLocation);
      if (dateFrom) params.append("from_date", dateFrom);
      if (dateTo) params.append("to_date", dateTo);
      
      const response = await sdk.client.fetch(`/admin/inventory/movements?${params.toString()}`, {
        method: "GET",
      });
      return response as { movements: InventoryMovement[] };
    },
  });

  // Mutation para crear movimiento manual
  const createMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await sdk.client.fetch("/admin/inventory/movements", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      alert("Error al crear el movimiento: " + error.message);
    }
  });

  const resetForm = () => {
    setMovementForm({
      movement_type: "adjustment",
      product_id: "",
      product_title: "",
      from_location_id: "",
      to_location_id: "",
      quantity: 0,
      unit_cost: 0,
      reason: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMovementMutation.mutate({
      ...movementForm,
      total_cost: movementForm.quantity * movementForm.unit_cost,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getMovementTypeLabel = (type: string) => {
    const labels = {
      supplier_receipt: "Recepción Proveedor",
      transfer_in: "Entrada Traspaso",
      transfer_out: "Salida Traspaso",
      adjustment: "Ajuste Manual",
      sale: "Venta",
      return: "Devolución",
      damage: "Daño/Pérdida",
      theft: "Robo",
      expired: "Caducado",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors = {
      supplier_receipt: "bg-green-100 text-green-800 border-green-200",
      transfer_in: "bg-blue-100 text-blue-800 border-blue-200",
      transfer_out: "bg-orange-100 text-orange-800 border-orange-200",
      adjustment: "bg-purple-100 text-purple-800 border-purple-200",
      sale: "bg-red-100 text-red-800 border-red-200",
      return: "bg-cyan-100 text-cyan-800 border-cyan-200",
      damage: "bg-red-200 text-red-900 border-red-300",
      theft: "bg-red-200 text-red-900 border-red-300",
      expired: "bg-gray-200 text-gray-800 border-gray-300",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getMovementTypeIcon = (type: string) => {
    const icons = {
      supplier_receipt: <TrendingUp className="w-4 h-4" />,
      transfer_in: <TrendingUp className="w-4 h-4" />,
      transfer_out: <TrendingDown className="w-4 h-4" />,
      adjustment: <ArrowUpDown className="w-4 h-4" />,
      sale: <TrendingDown className="w-4 h-4" />,
      return: <TrendingUp className="w-4 h-4" />,
      damage: <TrendingDown className="w-4 h-4" />,
      theft: <TrendingDown className="w-4 h-4" />,
      expired: <TrendingDown className="w-4 h-4" />,
    };
    return icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />;
  };

  const getQuantityDisplay = (movement: InventoryMovement) => {
    const isPositive = ["supplier_receipt", "transfer_in", "return", "adjustment"].includes(movement.movement_type);
    const quantity = Math.abs(movement.quantity);
    
    if (movement.movement_type === "adjustment") {
      // Para ajustes, mostrar + o - según el signo original
      return movement.quantity >= 0 ? `+${quantity}` : `-${quantity}`;
    }
    
    return isPositive ? `+${quantity}` : `-${quantity}`;
  };

  const getQuantityColor = (movement: InventoryMovement) => {
    const isPositive = ["supplier_receipt", "transfer_in", "return"].includes(movement.movement_type);
    
    if (movement.movement_type === "adjustment") {
      return movement.quantity >= 0 ? "text-green-600" : "text-red-600";
    }
    
    return isPositive ? "text-green-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Movimientos de Inventario</Heading>
        </div>
        <div className="px-6 py-8">
          <Text>Cargando movimientos...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Movimientos de Inventario</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-red-500">Error al cargar los movimientos</Text>
        </div>
      </Container>
    );
  }

  const movements: InventoryMovement[] = movementsData?.movements || [];

  // Filtros adicionales por búsqueda
  const filteredMovements = movements.filter((movement) => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      movement.product_title?.toLowerCase().includes(search) ||
      movement.reference_id?.toLowerCase().includes(search) ||
      movement.reason?.toLowerCase().includes(search) ||
      movement.performed_by?.toLowerCase().includes(search)
    );
  });

  // Paginación
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterByType, filterByProduct, filterByLocation, dateFrom, dateTo, searchTerm]);

  // Cálculos para estadísticas
  const stats = {
    totalMovements: filteredMovements.length,
    positiveMovements: filteredMovements.filter(m => 
      ["supplier_receipt", "transfer_in", "return"].includes(m.movement_type) || 
      (m.movement_type === "adjustment" && m.quantity >= 0)
    ).length,
    negativeMovements: filteredMovements.filter(m => 
      ["transfer_out", "sale", "damage", "theft", "expired"].includes(m.movement_type) ||
      (m.movement_type === "adjustment" && m.quantity < 0)
    ).length,
    totalValue: filteredMovements.reduce((sum, m) => sum + Math.abs(m.total_cost), 0),
  };

  // Formulario de creación de movimiento manual
  if (showCreateForm) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={() => { setShowCreateForm(false); resetForm(); }}>
              ← Volver
            </Button>
            <Heading level="h2">Crear Movimiento de Inventario</Heading>
          </div>
        </div>

        <div className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Movimiento *</label>
                <select
                  value={movementForm.movement_type}
                  onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="adjustment">Ajuste Manual</option>
                  <option value="transfer_in">Entrada por Traspaso</option>
                  <option value="transfer_out">Salida por Traspaso</option>
                  <option value="damage">Daño/Pérdida</option>
                  <option value="theft">Robo</option>
                  <option value="expired">Caducado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ID del Producto *</label>
                <input
                  type="text"
                  value={movementForm.product_id}
                  onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="prod_123..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nombre del Producto *</label>
                <input
                  type="text"
                  value={movementForm.product_title}
                  onChange={(e) => setMovementForm({ ...movementForm, product_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Descripción del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {movementForm.movement_type === "transfer_in" ? "Ubicación Origen" : 
                   movementForm.movement_type === "transfer_out" ? "Ubicación Destino" : 
                   "Ubicación"}
                </label>
                <input
                  type="text"
                  value={movementForm.movement_type === "transfer_in" ? movementForm.from_location_id : movementForm.to_location_id}
                  onChange={(e) => {
                    if (movementForm.movement_type === "transfer_in") {
                      setMovementForm({ ...movementForm, from_location_id: e.target.value });
                    } else {
                      setMovementForm({ ...movementForm, to_location_id: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="default, warehouse_1, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cantidad *</label>
                <input
                  type="number"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Cantidad (usar - para salidas en ajustes)"
                />
                <Text size="small" className="text-gray-500 mt-1">
                  {movementForm.movement_type === "adjustment" ? "Usar números positivos para entradas, negativos para salidas" : 
                   ["transfer_out", "sale", "damage", "theft", "expired"].includes(movementForm.movement_type) ? "Cantidad que sale del inventario" :
                   "Cantidad que entra al inventario"}
                </Text>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Costo Unitario</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={movementForm.unit_cost}
                  onChange={(e) => setMovementForm({ ...movementForm, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Motivo/Razón *</label>
              <textarea
                value={movementForm.reason}
                onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Descripción del motivo del movimiento..."
              />
            </div>

            {movementForm.quantity !== 0 && movementForm.unit_cost > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <Text className="font-medium">Resumen:</Text>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <Text>Cantidad:</Text>
                    <Text className={getQuantityColor({ movement_type: movementForm.movement_type, quantity: movementForm.quantity } as InventoryMovement)}>
                      {getQuantityDisplay({ movement_type: movementForm.movement_type, quantity: movementForm.quantity } as InventoryMovement)} unidades
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Valor Total:</Text>
                    <Text className="font-medium">{formatCurrency(Math.abs(movementForm.quantity * movementForm.unit_cost))}</Text>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={createMovementMutation.isPending}
              >
                {createMovementMutation.isPending ? "Creando..." : "Crear Movimiento"}
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

  // Vista principal
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Movimientos de Inventario</Heading>
        <div className="flex items-center gap-2">
          <Badge size="small">
            {filteredMovements.length}{" "}
            {filteredMovements.length === movements.length ? "movimientos" : `de ${movements.length} movimientos`}
          </Badge>
          <Button variant="secondary" size="small">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button variant="primary" size="small" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <Text size="small" className="text-blue-600">Total</Text>
            </div>
            <Text className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.totalMovements}</Text>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <Text size="small" className="text-green-600">Entradas</Text>
            </div>
            <Text className="text-2xl font-bold text-green-800 dark:text-green-300">{stats.positiveMovements}</Text>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <Text size="small" className="text-red-600">Salidas</Text>
            </div>
            <Text className="text-2xl font-bold text-red-800 dark:text-red-300">{stats.negativeMovements}</Text>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <Text size="small" className="text-purple-600">Valor Total</Text>
            </div>
            <Text className="text-xl font-bold text-purple-800 dark:text-purple-300">{formatCurrency(stats.totalValue)}</Text>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los tipos</option>
            <option value="supplier_receipt">📦 Recepción Proveedor</option>
            <option value="transfer_in">📥 Entrada Traspaso</option>
            <option value="transfer_out">📤 Salida Traspaso</option>
            <option value="adjustment">⚖️ Ajuste Manual</option>
            <option value="sale">🛒 Venta</option>
            <option value="return">↩️ Devolución</option>
            <option value="damage">💥 Daño/Pérdida</option>
            <option value="theft">🚨 Robo</option>
            <option value="expired">⏰ Caducado</option>
          </select>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              placeholder="Desde"
            />
            <Text size="small">-</Text>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              placeholder="Hasta"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, referencia, motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm min-w-[300px]"
            />
          </div>
          
          {(filterByType || dateFrom || dateTo || searchTerm) && (
            <button
              onClick={() => {
                setFilterByType("");
                setFilterByProduct("");
                setFilterByLocation("");
                setDateFrom("");
                setDateTo("");
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
        {paginatedMovements.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Text className="text-gray-500">
              {filteredMovements.length === 0 && (filterByType || dateFrom || dateTo || searchTerm)
                ? "No se encontraron movimientos que coincidan con los filtros"
                : "No hay movimientos de inventario registrados"}
            </Text>
            {filteredMovements.length === 0 && !filterByType && !dateFrom && !dateTo && !searchTerm && (
              <Button variant="primary" size="small" className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                Crear primer movimiento
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Fecha</Table.HeaderCell>
                <Table.HeaderCell>Tipo</Table.HeaderCell>
                <Table.HeaderCell>Producto</Table.HeaderCell>
                <Table.HeaderCell>Cantidad</Table.HeaderCell>
                <Table.HeaderCell>Ubicación</Table.HeaderCell>
                <Table.HeaderCell>Costo</Table.HeaderCell>
                <Table.HeaderCell>Referencia</Table.HeaderCell>
                <Table.HeaderCell>Motivo</Table.HeaderCell>
                <Table.HeaderCell>Usuario</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedMovements.map((movement) => (
                <Table.Row key={movement.id}>
                  <Table.Cell>
                    <Text size="small" className="font-medium">{formatDate(movement.performed_at)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge className={getMovementTypeColor(movement.movement_type)} size="small">
                      {getMovementTypeIcon(movement.movement_type)}
                      {getMovementTypeLabel(movement.movement_type)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1">
                      <Text className="font-medium">{movement.product_title || "Producto no especificado"}</Text>
                      <Text size="small" className="text-gray-500">ID: {movement.product_id}</Text>
                      {movement.product_variant_id && (
                        <Text size="small" className="text-gray-400">Variante: {movement.product_variant_id}</Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className={`font-bold ${getQuantityColor(movement)}`}>
                      {getQuantityDisplay(movement)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1">
                      {movement.from_location_id && (
                        <div className="flex items-center gap-1">
                          <Text size="small" className="text-gray-500">De:</Text>
                          <Text size="small">{movement.from_location_id}</Text>
                        </div>
                      )}
                      {movement.to_location_id && (
                        <div className="flex items-center gap-1">
                          <Text size="small" className="text-gray-500">A:</Text>
                          <Text size="small">{movement.to_location_id}</Text>
                        </div>
                      )}
                      {!movement.from_location_id && !movement.to_location_id && (
                        <Text size="small" className="text-gray-400">-</Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1">
                      <Text size="small">{formatCurrency(movement.unit_cost)} /ud</Text>
                      <Text className="font-medium">{formatCurrency(Math.abs(movement.total_cost))}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1">
                      <Text size="small" className="text-gray-600">{movement.reference_type || "-"}</Text>
                      <Text size="small" className="font-mono text-gray-500">{movement.reference_id || "-"}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-gray-600">
                      {movement.reason ? (
                        movement.reason.length > 50 ? 
                        `${movement.reason.substring(0, 50)}...` : 
                        movement.reason
                      ) : "-"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-gray-500">
                      {movement.performed_by || "Sistema"}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        {/* Paginación */}
        {filteredMovements.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Text size="small">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredMovements.length)} de {filteredMovements.length} movimientos
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
  label: "Movimientos de Inventario",
  icon: Activity,
});

export default InventoryMovementsPage;