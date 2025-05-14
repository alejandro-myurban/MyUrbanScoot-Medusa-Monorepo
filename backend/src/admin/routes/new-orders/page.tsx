import { useMemo, useState } from "react";
import {
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
  createDataTableCommandHelper,
  DataTableRowSelectionState,
  Heading,
  StatusBadge,
  DataTablePaginationState,
  Skeleton,
  FocusModal,
  Button,
  Select,
  createDataTableFilterHelper,
  DataTableFilteringState,
} from "@medusajs/ui";
import { toast } from "@medusajs/ui";
import { sdk } from "../../lib/sdk";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { MagnifyingGlass, ShoppingCart } from "@medusajs/icons";
import { useNavigate } from "react-router-dom";

export const config = defineRouteConfig({
  label: "Pedidos",
  icon: ShoppingCart,
});

const OrdersPage = () => {
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(
    {}
  );

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 50, // Aumentar el tamaño de página
    pageIndex: 0,
  });

  const [filtering, setFiltering] = useState<DataTableFilteringState>({});

  const [month, setMonth] = useState<string>("1");
  const [day, setDay] = useState<string>("1");
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const offset = useMemo(() => {
    return pagination.pageIndex * pagination.pageSize;
  }, [pagination]);

  const productionFilterValues = useMemo<string[]>(() => {
    return (filtering.production_status as string[]) || [];
  }, [filtering]);

  const fulfillmentFilterValues = useMemo<string[]>(
    () => (filtering.fulfillment_status as string[]) || [],
    [filtering]
  );

  const navigate = useNavigate();
  // Modificar la consulta para incluir el cliente y otros datos relevantes
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryFn: async () => {
      const result = await sdk.admin.order.list({
        fields: "customer.*,shipping_address,items,metadata,created_at,total",
        limit: pagination.pageSize,
        offset: offset,
      });

      let filtered = result.orders;

      // Filtrar los resultados en el cliente si es necesario
      if (productionFilterValues.length) {
        filtered = filtered.filter((o) =>
          productionFilterValues.includes(
            o.metadata?.production_status as string
          )
        );
      }

      if (fulfillmentFilterValues.length) {
        filtered = filtered.filter((o) =>
          fulfillmentFilterValues.includes(o.fulfillment_status!)
        );
      }

      return { ...result, orders: filtered };
    },
    queryKey: [
      [
        "orders",
        pagination.pageIndex,
        pagination.pageSize,
        productionFilterValues.join(","),
        fulfillmentFilterValues.join(","),
      ],
    ],
  });

  const orders = data?.orders || [];
  console.log("Órdenes completas:", orders);

  const columnHelper = createDataTableColumnHelper<any>();
  const filterHelper = createDataTableFilterHelper<any>();

  const thumbnailColumn = columnHelper.accessor("items", {
    id: "thumbnail",
    header: "Thumbnail",
    cell: (info) => {
      const items = info.getValue();
      if (!items || items.length === 0) return null;

      // Limitar a 3 thumbnails
      const maxImages = 3;
      const thumbnailsToShow = items.slice(0, maxImages);

      return (
        <div className="flex items-center flex-wrap justify-center py-2 px-2 gap-1">
          {thumbnailsToShow.map((item, index) => (
            <img
              key={`${item.id}_${index}`}
              src={item.thumbnail}
              alt={`Item ${item.product_handle + 1}`}
              className="w-10 h-10 object-cover rounded"
            />
          ))}
          {items.length > maxImages && (
            <span className="text-sm">+{items.length - maxImages}</span>
          )}
        </div>
      );
    },
  });

  const columns = [
    columnHelper.select(),
    columnHelper.accessor("actions", {
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate(`/orders/${row.original.id}`)}
          >
            <MagnifyingGlass />
          </Button>
        );
      },
    }),
    thumbnailColumn,
    columnHelper.accessor("customer", {
      header: "Cliente",
      cell: (info) => {
        const customer = info.getValue();
        return customer
          ? `${customer.first_name || ""} ${customer.last_name || ""} (${
              customer.email || "Sin email"
            })`
          : "Sin cliente";
      },
    }),
    columnHelper.accessor("items", {
      id: "items",
      header: "Artículos",
      cell: (info) => {
        const items = info.getValue();
        if (!items || items.length === 0) return "Sin artículos";

        return (
          <div className="flex flex-col gap-1">
            {items.map((item, index) => (
              <div key={item.id ?? index} className="flex flex-col">
                {/* Primera línea: título + cantidad */}
                <span>
                  {item.title} <strong>({item.quantity})</strong>
                </span>

                {/* Segunda línea: si hay custom_name, mostramos:
                    Nombre personalizado (cantidad) – custom_name */}
                {item.metadata?.custom_name && (
                  <span>
                    Nombre: <strong>{item.metadata.custom_name}</strong>
                  </span>
                )}
                {item.metadata?.custom_number && (
                  <span>
                    Número: <strong>{item.metadata.custom_number}</strong>
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor("payment_status", {
      header: "Pago",
      cell: (info) => {
        const payment = info.getValue();
        if (payment === "captured") {
          return <StatusBadge color="green">Pago OK</StatusBadge>;
        } else if (payment === "authorized") {
          return <StatusBadge color="orange">Pago Autorizado</StatusBadge>;
        } else if (payment === "canceled") {
          return <StatusBadge color="red">Pago Cancelado</StatusBadge>;
        } else {
          return <StatusBadge color="red">Error</StatusBadge>;
        }
      },
    }),
    columnHelper.accessor("fulfillment_status", {
      header: "Envío",
      cell: (info) => {
        const fulfillment = info.getValue();
        if (fulfillment === "delivered") {
          return <StatusBadge color="green">Entregado</StatusBadge>;
        } else if (fulfillment === "not_fulfilled") {
          return <StatusBadge color="orange">Pendiente</StatusBadge>;
        } else if (fulfillment === "fulfilled") {
          return <StatusBadge color="blue">Enviado</StatusBadge>;
        }
      },
    }),

    // Si necesitas depurar datos
    columnHelper.accessor(
      (row) => {
        console.log("Estado de producción:", row);
        return row.metadata && row.metadata.production_status_display
          ? row.metadata.production_status_display
          : null;
      },
      {
        header: "Producción",
        id: "production_status",
        cell: (info) => {
          const status = info.getValue();

          if (status) {
            return <StatusBadge color="red">{status}</StatusBadge>;
          } else {
            return <StatusBadge color="orange">En Espera</StatusBadge>;
          }
        },
      }
    ),
    columnHelper.accessor("total", {
      header: "Total",
      cell: (info) => {
        const total = info.getValue();
        return total ? `${total} €` : "N/A";
      },
    }),
    columnHelper.accessor("created_at", {
      header: "Fecha",
      cell: (info) => {
        const date = info.getValue();
        return date ? new Date(date).toLocaleString("es-ES") : "N/A";
      },
    }),
  ];

  const commandHelper = createDataTableCommandHelper();
  const commands = [
    commandHelper.command({
      label: "Pasar a espera de stock",
      shortcut: "S",
      action: async (selection) => {
        const orderIds = Object.keys(selection);
        console.log("IDs seleccionados:", orderIds);
        // Solo guardamos los IDs y abrimos el modal
        setSelectedOrderIds(orderIds);
        setIsModalOpen(true);
      },
    }),
    commandHelper.command({
      label: "Pasar a producción de vinilos",
      shortcut: "V",
      action: async (selection) => {
        const ids = Object.keys(selection);
        if (ids.length === 0) {
          toast.info("Selecciona al menos una orden");
          return;
        }

        try {
          await sdk.client.fetch("/admin/orders/production/vinyl", {
            method: "POST",
            body: { ids },
          });
          toast.success("Órdenes lanzadas a producción de vinilos");
          refetch();
        } catch (err) {
          toast.error("Error al iniciar producción de vinilos");
        }
      },
    }),
    commandHelper.command({
      label: "Marcar como enviado",
      shortcut: "E",
      action: async (selection) => {
        const ids = Object.keys(selection);
        if (ids.length === 0) {
          toast.info("Selecciona al menos una orden");
          return;
        }
        try {
          await sdk.client.fetch("/admin/orders/switch-to-delivered", {
            method: "POST",
            body: { ids },
          });
          toast.success("Órdenes marcadas como enviadas");
          refetch();
        } catch (err) {
          toast.error("Las órdenes ya están enviadas o no existen");
        }
      },
    }),
    commandHelper.command({
      label: "Exportar a CSV / Excel",
      shortcut: "X",
      action: async (selection) => {
        const ids = Object.keys(selection);
        if (!ids.length) {
          toast.info("Selecciona al menos una orden");
          return;
        }

        try {
          // Construir la URL con los IDs como parámetros de consulta
          const queryParams = new URLSearchParams();
          ids.forEach((id) => queryParams.append("ids", id));
          const url = `/admin/orders/export-csv?${queryParams.toString()}`;

          // Redirigir al navegador a la URL para descargar directamente
          window.open(url, "_blank");
          toast.success("¡CSV generado correctamente!");
        } catch (err) {
          console.error(err);
          toast.error(
            err instanceof Error ? err.message : "Error al exportar las órdenes"
          );
        }
      },
    }),
    commandHelper.command({
      label: "Exportar Packing Slips (PDF)",
      shortcut: "P",
      action: async (selection) => {
        const ids = Object.keys(selection);
        if (!ids.length) {
          toast.info("Selecciona al menos una orden");
          return;
        }

        try {
          // Construir la URL con los IDs como parámetros de consulta
          const queryParams = new URLSearchParams();
          ids.forEach((id) => queryParams.append("ids", id));
          const url = `/admin/orders/export-pdf-slips?${queryParams.toString()}`;

          // Abrir una nueva pestaña para descargar el PDF
          window.open(url, "_blank");
          toast.success("¡PDF de packing slips generado correctamente!");
        } catch (err) {
          console.error(err);
          toast.error(
            err instanceof Error
              ? err.message
              : "Error al exportar los packing slips"
          );
        }
      },
    }),

    // Puedes añadir más comandos aquí
  ];

  const filters = [
    filterHelper.accessor("production_status", {
      label: "Producción",
      type: "select",
      options: [
        { label: "Producción de Vinilos", value: "produccion_vinilos" },
        { label: "Espera de Stock", value: "espera_stock" },
        { label: "Producción de Baterías", value: "produccion_baterias" },
      ],
    }),
    filterHelper.accessor("fulfillment_status", {
      label: "Envío",
      type: "select",
      options: [
        { label: "Pendiente", value: "not_fulfilled" },
        { label: "Enviado", value: "fulfilled" },
        { label: "Entregado", value: "delivered" },
      ],
    }),
  ];

  const table = useDataTable({
    columns,
    data: orders || [],
    commands,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection,
    },
    filters,
    filtering: {
      state: filtering,
      onFilteringChange: setFiltering,
    },
    rowCount: data?.count || 0,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    getRowId: (row) => row.id,
    onRowClick(event, row) {
      const rowId = row.id;

      setRowSelection((prev) => {
        const newSelection = { ...prev };

        if (newSelection[rowId]) {
          delete newSelection[rowId];
        } else {
          newSelection[rowId] = true;
        }

        return newSelection;
      });
    },
  });

  return (
    <>
      <div className="max-w-[600px] flex justify-center items-center  mx-auto mb-4">
        <FocusModal open={isModalOpen} onOpenChange={setIsModalOpen}>
          <FocusModal.Content className="flex max-w-[600px] absolute h-80 top-60 left-1/2 transform -translate-x-1/2">
            <FocusModal.Header className="font-semibold text-lg">
              Confirmar cambio
            </FocusModal.Header>
            <FocusModal.Body className="p-4">
              <p>
                ¿Quieres pasar las órdenes seleccionadas a stock? Esto cambiará
                su cambiará el estado a "En espera de stock" y se enviará un
                email al cliente con la fecha de stock disponible.
              </p>
              <div className="px-6 py-4 flex gap-4">
                <div className="w-1/6">
                  <label className="text-ui-fg-subtle mb-1 block text-sm">
                    Día
                  </label>
                  <Select value={day} onValueChange={setDay}>
                    <Select.Trigger>
                      <Select.Value placeholder="Día" />
                    </Select.Trigger>
                    <Select.Content>
                      {days.map((d) => (
                        <Select.Item key={d} value={d}>
                          {d}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
                <div className="w-1/6">
                  <label className="text-ui-fg-subtle mb-1 block text-sm">
                    Mes
                  </label>
                  <Select value={month} onValueChange={setMonth}>
                    <Select.Trigger>
                      <Select.Value placeholder="Mes" />
                    </Select.Trigger>
                    <Select.Content>
                      {months.map((m) => (
                        <Select.Item key={m} value={m}>
                          {m}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              </div>
            </FocusModal.Body>
            <FocusModal.Footer>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await sdk.client.fetch("/admin/orders/switch-to-stock", {
                      method: "POST",
                      body: {
                        ids: selectedOrderIds,
                        day,
                        month,
                      },
                    });
                    toast.success("Órdenes pasadas a stock correctamente");
                    await refetch();
                    setIsModalOpen(false);
                  } catch (error) {
                    toast.error("Error al pasar a stock las órdenes");
                  }
                }}
              >
                Confirmar
              </Button>
            </FocusModal.Footer>
          </FocusModal.Content>
        </FocusModal>
      </div>
      <div className="p-8 max-w-[1280px] mx-auto">
        <DataTable instance={table}>
          {isLoading ? (
            <div className="w-full">
              <div className="mb-4">
                <Skeleton className="h-10 w-[1200px]" />{" "}
                {/* Título "Órdenes" */}
              </div>

              {/* Skeleton para la barra de herramientas */}
              <Skeleton className="w-full h-12 mb-4" />

              {/* Skeleton para el encabezado de la tabla */}
              <div className="w-full flex mb-2">
                <Skeleton className="w-10 h-10 mr-2" />{" "}
                {/* Checkbox de selección */}
                <Skeleton className="flex-1 h-10 mr-2" /> {/* Thumbnail */}
                <Skeleton className="flex-1 h-10 mr-2" /> {/* Cliente */}
                <Skeleton className="flex-1 h-10 mr-2" /> {/* Artículos */}
                <Skeleton className="flex-1 h-10 mr-2" /> {/* Pago */}
                <Skeleton className="flex-1 h-10 mr-2" /> {/* Envío */}
                <Skeleton className="flex-1 h-10" /> {/* Estado taller */}
              </div>

              {/* Skeletons para las filas de datos */}
              {Array.from({ length: pagination.pageSize }).map((_, i) => (
                <div key={i} className="w-full flex mb-2">
                  <Skeleton className="w-10 h-16 mr-2" />{" "}
                  {/* Checkbox de selección */}
                  <Skeleton className="flex-1 h-16 mr-2" /> {/* Thumbnail */}
                  <Skeleton className="flex-1 h-16 mr-2" /> {/* Cliente */}
                  <Skeleton className="flex-1 h-16 mr-2" /> {/* Artículos */}
                  <Skeleton className="flex-1 h-16 mr-2" /> {/* Pago */}
                  <Skeleton className="flex-1 h-16 mr-2" /> {/* Envío */}
                  <Skeleton className="flex-1 h-16" /> {/* Estado taller */}
                </div>
              ))}

              {/* Skeleton para la paginación */}
              <Skeleton className="w-full h-10 mt-4" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h1 className="text-2xl font-bold">Órdenes</h1>
              </div>
              <DataTable.Toolbar className="px-0 py-4 flex items-end justify-between">
                <Heading className="flex flex-col p-0">
                  Selecciona las ordenes y pulsa:
                  <p className="flex gap-2 text-ui-fg-subtle">
                    <span className=" font-bold text-black dark:text-white">
                      E:
                    </span>
                    Marcar como Enviado
                  </p>
                  <p className="flex gap-2 text-ui-fg-subtle">
                    <span className=" font-bold text-black dark:text-white">
                      S:
                    </span>
                    Pasar a Espera de Stock
                  </p>
                  <p className="flex gap-2 text-ui-fg-subtle">
                    <span className=" font-bold text-black dark:text-white">
                      V:
                    </span>
                    Pasar a Producción de Vinilos
                  </p>
                  <p className="flex gap-2 text-ui-fg-subtle">
                    <span className=" font-bold text-black dark:text-white">
                      X:
                    </span>
                    Exportar a CSV
                  </p>
                  <p className="flex gap-2 text-ui-fg-subtle">
                    <span className=" font-bold text-black dark:text-white">
                      P:
                    </span>
                    Exportar Packing Slips como PDF
                  </p>
                  <div className="flex gap-2 items-end ">
                    Filtros
                    <DataTable.FilterMenu tooltip="Filtros" />
                  </div>
                </Heading>
              </DataTable.Toolbar>
              <DataTable.Table />
              <DataTable.Pagination />
            </>
          )}
          <DataTable.CommandBar
            selectedLabel={(count) => `${count} seleccionadas`}
          />
        </DataTable>
      </div>
    </>
  );
};

export default OrdersPage;
