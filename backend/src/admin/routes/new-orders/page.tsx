"use client"

import { useMemo, useState } from "react"
import {
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
  createDataTableCommandHelper,
  type DataTableRowSelectionState,
  StatusBadge,
  type DataTablePaginationState,
  Skeleton,
  FocusModal,
  Button,
  Select,
  createDataTableFilterHelper,
  type DataTableFilteringState,
  Container,
  Badge,
} from "@medusajs/ui"
import { toast } from "@medusajs/ui"
import { sdk } from "../../lib/sdk"
import { useQuery } from "@tanstack/react-query"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass, ShoppingCart } from "@medusajs/icons"
import { useNavigate } from "react-router-dom"
import { Package, Truck, Clock, Disc3, Download, FileText, Receipt } from "lucide-react"

export const config = defineRouteConfig({
  label: "Pedidos",
  icon: ShoppingCart,
})

const OrdersPage = () => {
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>({})

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 50, // Aumentar el tamaño de página
    pageIndex: 0,
  })

  const [filtering, setFiltering] = useState<DataTableFilteringState>({})

  const [month, setMonth] = useState<string>("1")
  const [day, setDay] = useState<string>("1")
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState([])

  const offset = useMemo(() => {
    return pagination.pageIndex * pagination.pageSize
  }, [pagination])

  const productionFilterValues = useMemo<string[]>(() => {
    return (filtering.production_status as string[]) || []
  }, [filtering])

  const fulfillmentFilterValues = useMemo<string[]>(() => (filtering.fulfillment_status as string[]) || [], [filtering])

  const navigate = useNavigate()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryFn: async () => {
      const result = await sdk.admin.order.list({
        fields: "customer.*,shipping_address,items,metadata,created_at,total",
        limit: pagination.pageSize,
        offset: offset,
      })

      let filtered = result.orders

      // Filtrar los resultados en el cliente si es necesario
      if (productionFilterValues.length) {
        filtered = filtered.filter((o) => productionFilterValues.includes(o.metadata?.production_status as string))
      }

      if (fulfillmentFilterValues.length) {
        filtered = filtered.filter((o) => fulfillmentFilterValues.includes(o.fulfillment_status!))
      }

      return { ...result, orders: filtered }
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
  })

  const orders = data?.orders || []
  console.log("Órdenes completas:", orders)

  const columnHelper = createDataTableColumnHelper<any>()
  const filterHelper = createDataTableFilterHelper<any>()

  const thumbnailColumn = columnHelper.accessor("items", {
    id: "thumbnail",
    header: "Thumbnail",
    cell: (info) => {
      const items = info.getValue()
      if (!items || items.length === 0) return null

      // Limitar a 3 thumbnails
      const maxImages = 3
      const thumbnailsToShow = items.slice(0, maxImages)

      return (
        <div className="flex items-center flex-wrap justify-center py-2 px-2 gap-1">
          {thumbnailsToShow.map((item, index) => (
            <img
              key={`${item.id}_${index}`}
              src={item.thumbnail || "/placeholder.svg"}
              alt={`Item ${item.product_handle + 1}`}
              className="w-10 h-10 object-cover rounded"
            />
          ))}
          {items.length > maxImages && <span className="text-sm">+{items.length - maxImages}</span>}
        </div>
      )
    },
  })

  const columns = [
    columnHelper.select(),
    columnHelper.accessor("actions", {
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button variant="secondary" size="small" onClick={() => navigate(`/orders/${row.original.id}`)}>
            <MagnifyingGlass />
          </Button>
        )
      },
    }),
    thumbnailColumn,
    columnHelper.accessor("customer", {
      header: "Cliente",
      cell: (info) => {
        const customer = info.getValue()
        return customer
          ? `${customer.first_name || ""} ${customer.last_name || ""} (${customer.email || "Sin email"})`
          : "Sin cliente"
      },
    }),
    columnHelper.accessor("items", {
      id: "items",
      header: "Artículos",
      cell: (info) => {
        const items = info.getValue()
        if (!items || items.length === 0) return "Sin artículos"

        return (
          <div className="flex flex-col gap-1">
            {items.map((item, index) => (
              <div key={item.id ?? index} className="flex flex-col">
                {/* Primera línea: título + cantidad */}
                <span className="w-72 text-wrap">
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
        )
      },
    }),
    columnHelper.accessor("payment_status", {
      header: "Pago",
      cell: (info) => {
        const payment = info.getValue()
        if (payment === "captured") {
          return <StatusBadge color="green">Pago OK</StatusBadge>
        } else if (payment === "authorized") {
          return <StatusBadge color="orange">Pago Autorizado</StatusBadge>
        } else if (payment === "canceled") {
          return <StatusBadge color="red">Pago Cancelado</StatusBadge>
        } else {
          return <StatusBadge color="red">Error</StatusBadge>
        }
      },
    }),
    columnHelper.accessor("fulfillment_status", {
      header: "Envío",
      cell: (info) => {
        const fulfillment = info.getValue()
        if (fulfillment === "delivered") {
          return <StatusBadge color="green">Entregado</StatusBadge>
        } else if (fulfillment === "not_fulfilled") {
          return <StatusBadge color="orange">Pendiente</StatusBadge>
        } else if (fulfillment === "fulfilled") {
          return <StatusBadge color="blue">Enviado</StatusBadge>
        }
      },
    }),

    // Si necesitas depurar datos
    columnHelper.accessor(
      (row) => {
        console.log("Estado de producción:", row)
        return row.metadata && row.metadata.production_status_display ? row.metadata.production_status_display : null
      },
      {
        header: "Producción",
        id: "production_status",
        cell: (info) => {
          const status = info.getValue()

          if (status) {
            return <StatusBadge color="red">{status}</StatusBadge>
          } else {
            return <StatusBadge color="orange">En Espera</StatusBadge>
          }
        },
      },
    ),
    columnHelper.accessor("total", {
      header: "Total",
      cell: (info) => {
        const total = info.getValue()
        return total ? `${total} €` : "N/A"
      },
    }),
    columnHelper.accessor("created_at", {
      header: "Fecha",
      cell: (info) => {
        const date = info.getValue()
        return date ? new Date(date).toLocaleString("es-ES") : "N/A"
      },
    }),
  ]

  const commandHelper = createDataTableCommandHelper()
  const commands = [
    commandHelper.command({
      label: "Pasar a espera de stock",
      shortcut: "S",
      action: async (selection) => {
        const orderIds = Object.keys(selection)
        console.log("IDs seleccionados:", orderIds)
        // Solo guardamos los IDs y abrimos el modal
        setSelectedOrderIds(orderIds)
        setIsModalOpen(true)
      },
    }),
    commandHelper.command({
      label: "Pasar a producción de vinilos",
      shortcut: "V",
      action: async (selection) => {
        const ids = Object.keys(selection)
        if (ids.length === 0) {
          toast.info("Selecciona al menos una orden")
          return
        }

        try {
          await sdk.client.fetch("/admin/orders/production/vinyl", {
            method: "POST",
            body: { ids },
          })
          toast.success("Órdenes lanzadas a producción de vinilos")
          refetch()
        } catch (err) {
          toast.error("Error al iniciar producción de vinilos")
        }
      },
    }),
    commandHelper.command({
      label: "Marcar como enviado",
      shortcut: "E",
      action: async (selection) => {
        const ids = Object.keys(selection)
        if (ids.length === 0) {
          toast.info("Selecciona al menos una orden")
          return
        }
        try {
          await sdk.client.fetch("/admin/orders/switch-to-delivered", {
            method: "POST",
            body: { ids },
          })
          toast.success("Órdenes marcadas como enviadas")
          refetch()
        } catch (err) {
          toast.error("Las órdenes ya están enviadas o no existen")
        }
      },
    }),
    commandHelper.command({
      label: "Exportar a CSV / Excel",
      shortcut: "X",
      action: async (selection) => {
        const ids = Object.keys(selection)
        if (!ids.length) {
          toast.info("Selecciona al menos una orden")
          return
        }

        try {
          // Construir la URL con los IDs como parámetros de consulta
          const queryParams = new URLSearchParams()
          ids.forEach((id) => queryParams.append("ids", id))
          const url = `/admin/orders/export-csv?${queryParams.toString()}`

          // Redirigir al navegador a la URL para descargar directamente
          window.open(url, "_blank")
          toast.success("¡CSV generado correctamente!")
        } catch (err) {
          console.error(err)
          toast.error(err instanceof Error ? err.message : "Error al exportar las órdenes")
        }
      },
    }),
    commandHelper.command({
      label: "Exportar Packing Slips (PDF)",
      shortcut: "P",
      action: async (selection) => {
        const ids = Object.keys(selection)
        if (!ids.length) {
          toast.info("Selecciona al menos una orden")
          return
        }

        try {
          // Construir la URL con los IDs como parámetros de consulta
          const queryParams = new URLSearchParams()
          ids.forEach((id) => queryParams.append("ids", id))
          const url = `/admin/orders/export-pdf-slips?${queryParams.toString()}`

          // Abrir una nueva pestaña para descargar el PDF
          window.open(url, "_blank")
          toast.success("¡PDF de packing slips generado correctamente!")
        } catch (err) {
          console.error(err)
          toast.error(err instanceof Error ? err.message : "Error al exportar los packing slips")
        }
      },
    }),
    commandHelper.command({
      label: "Exportar Facturas (PDF)",
      shortcut: "F",
      action: async (selection) => {
        const ids = Object.keys(selection)
        if (!ids.length) {
          toast.info("Selecciona al menos una orden para exportar la factura.")
          return
        }

        try {
          const queryParams = new URLSearchParams()
          ids.forEach((id) => queryParams.append("ids", id))
          const url = `/admin/orders/export-pdf-invoices?${queryParams.toString()}`

          // Abre la URL en una nueva pestaña para disparar la descarga.
          // Tu backend está enviando el PDF directamente como respuesta.
          window.open(url, "_blank")
          toast.success("¡PDF de facturas generado correctamente!")
        } catch (err) {
          console.error(err)
          toast.error(err instanceof Error ? err.message : "Error al exportar las facturas.")
        }
      },
    }),
  ]

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
  ]

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
      const rowId = row.id

      setRowSelection((prev) => {
        const newSelection = { ...prev }

        if (newSelection[rowId]) {
          delete newSelection[rowId]
        } else {
          newSelection[rowId] = true
        }

        return newSelection
      })
    },
  })

  return (
    <>
      <FocusModal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <FocusModal.Content className="max-w-lg">
          <FocusModal.Header>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Confirmar cambio de estado</h2>
              <p className="text-sm text-ui-fg-subtle">Selecciona la fecha de disponibilidad de stock</p>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="space-y-6">
            <div className="p-4 bg-ui-bg-subtle rounded-lg border">
              <p className="text-sm leading-relaxed">
                ¿Quieres pasar las órdenes seleccionadas a stock? Esto cambiará el estado a{" "}
                <strong>"En espera de stock"</strong> y se enviará un email al cliente con la fecha de stock disponible.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ui-fg-base">Día</label>
                <Select value={day} onValueChange={setDay}>
                  <Select.Trigger className="w-full">
                    <Select.Value placeholder="Seleccionar día" />
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-ui-fg-base">Mes</label>
                <Select value={month} onValueChange={setMonth}>
                  <Select.Trigger className="w-full">
                    <Select.Value placeholder="Seleccionar mes" />
                  </Select.Trigger>
                  <Select.Content>
                    {months.map((m) => (
                      <Select.Item key={m} value={m}>
                        {new Date(2024, Number.parseInt(m) - 1).toLocaleDateString("es-ES", { month: "long" })}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>
          </FocusModal.Body>
          <FocusModal.Footer className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
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
                  })
                  toast.success("Órdenes pasadas a stock correctamente")
                  await refetch()
                  setIsModalOpen(false)
                } catch (error) {
                  toast.error("Error al pasar a stock las órdenes")
                }
              }}
              className="flex-1"
            >
              Confirmar cambio
            </Button>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>

      <Container className="p-0">
        <DataTable instance={table}>
          {isLoading ? (
            <div className="w-full p-6">
              <div className="mb-6">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>

              {/* Skeleton para la barra de herramientas */}
              <div className="mb-6 space-y-4">
                <Skeleton className="w-full h-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>

              {/* Skeleton para el encabezado de la tabla */}
              <div className="w-full flex mb-2 p-4 bg-ui-bg-subtle rounded-t-lg">
                <Skeleton className="w-10 h-6 mr-4" />
                <Skeleton className="flex-1 h-6 mr-4" />
                <Skeleton className="flex-1 h-6 mr-4" />
                <Skeleton className="flex-1 h-6 mr-4" />
                <Skeleton className="flex-1 h-6 mr-4" />
                <Skeleton className="flex-1 h-6 mr-4" />
                <Skeleton className="flex-1 h-6" />
              </div>

              {/* Skeletons para las filas de datos */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-full flex mb-1 p-4 border-b">
                  <Skeleton className="w-10 h-12 mr-4" />
                  <Skeleton className="flex-1 h-12 mr-4" />
                  <Skeleton className="flex-1 h-12 mr-4" />
                  <Skeleton className="flex-1 h-12 mr-4" />
                  <Skeleton className="flex-1 h-12 mr-4" />
                  <Skeleton className="flex-1 h-12 mr-4" />
                  <Skeleton className="flex-1 h-12" />
                </div>
              ))}

              {/* Skeleton para la paginación */}
              <div className="flex justify-between items-center mt-6 p-4">
                <Skeleton className="w-32 h-8" />
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8" />
                  <Skeleton className="w-8 h-8" />
                  <Skeleton className="w-8 h-8" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-ui-bg-base to-ui-bg-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center justify-center">
                    <Package />
                    <h1 className="text-2xl font-bold text-ui-fg-base">Gestión de Pedidos</h1>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-ui-fg-base">{data?.count || 0}</p>
                    <p className="text-sm text-ui-fg-subtle">órdenes totales</p>
                  </div>
                </div>
              </div>

              <div className="px-6">
                <DataTable.Toolbar className="p-0">
                  <div className="space-y-6">
                    {/* Keyboard shortcuts section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-ui-fg-base flex items-center gap-2">
                        ⌨️ Atajos de teclado
                        <span className="text-xs text-ui-fg-subtle">(selecciona órdenes primero)</span>
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg border">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <Badge size="small" className="bg-blue-100 text-blue-800 font-mono">
                            E
                          </Badge>
                          <span className="text-sm text-ui-fg-base">Marcar como Enviado</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg border">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <Badge size="small" className="bg-orange-100 text-orange-800 font-mono">
                            S
                          </Badge>
                          <span className="text-sm text-ui-fg-base">Espera de Stock</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg border">
                          <Disc3 className="w-4 h-4 text-purple-600" />
                          <Badge size="small" className="bg-purple-100 text-purple-800 font-mono">
                            V
                          </Badge>
                          <span className="text-sm text-ui-fg-base">Producción Vinilos</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg border">
                          <Download className="w-4 h-4 text-green-600" />
                          <Badge size="small" className="bg-green-100 text-green-800 font-mono">
                            X
                          </Badge>
                          <span className="text-sm text-ui-fg-base">Exportar CSV</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg border">
                          <FileText className="w-4 h-4 text-red-600" />
                          <Badge size="small" className="bg-red-100 text-red-800 font-mono">
                            P
                          </Badge>
                          <span className="text-sm text-ui-fg-base">Packing Slips PDF</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg border">
                          <Receipt className="w-4 h-4 text-indigo-600" />
                          <Badge size="small" className="bg-indigo-100 text-indigo-800 font-mono">
                            F
                          </Badge>
                          <span className="text-sm text-ui-fg-base">Facturas PDF</span>
                        </div>
                      </div>
                    </div>

                    {/* Filters section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-ui-fg-base flex items-center gap-2">🔍 Filtros</h3>
                      <div className="flex items-center gap-4 p-4 bg-ui-bg-subtle rounded-lg border">
                        <span className="text-sm text-ui-fg-subtle min-w-fit">Filtrar por:</span>
                        <DataTable.FilterMenu
                          tooltip="Aplicar filtros a la tabla"
                          className="bg-white border-ui-border-base hover:bg-ui-bg-subtle-hover"
                        />
                        {(productionFilterValues.length > 0 || fulfillmentFilterValues.length > 0) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ui-fg-subtle">Filtros activos:</span>
                            {productionFilterValues.map((filter) => (
                              <Badge key={filter} size="small" className="bg-blue-100 text-blue-800">
                                {filter}
                              </Badge>
                            ))}
                            {fulfillmentFilterValues.map((filter) => (
                              <Badge key={filter} size="small" className="bg-green-100 text-green-800">
                                {filter}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </DataTable.Toolbar>
              </div>

              <div className="px-6">
                <div className="border rounded-lg overflow-hidden ">
                  <DataTable.Table />
                </div>
                <div className="mt-4">
                  <DataTable.Pagination />
                </div>
              </div>
            </div>
          )}
          <DataTable.CommandBar
            selectedLabel={(count) => `${count} órdenes seleccionadas`}
            className="bg-ui-bg-base border-ui-border-base"
          />
        </DataTable>
      </Container>
    </>
  )
}

export default OrdersPage
