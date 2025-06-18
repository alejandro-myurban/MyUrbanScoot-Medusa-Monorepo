import { Container, Heading, Table, Badge, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { sdk } from "../../lib/sdk"

type FinancingData = {
  id: string
  name: string
  email: string
  phone: string
  product: string
  months: number
  price: number
  requested_at: string
  created_at: string
}

const FinancingPage = () => {
  const { data: financingData, isLoading, error } = useQuery<{ financing_data: FinancingData[] }>({
    queryKey: ["financing-data"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/financing-data", {
        method: "GET",
      })
      return response as { financing_data: FinancingData[] }
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Solicitudes de Financiación</Heading>
        </div>
        <div className="px-6 py-8">
          <Text>Cargando datos...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Solicitudes de Financiación</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-red-500">Error al cargar los datos</Text>
        </div>
      </Container>
    )
  }

  const financing: FinancingData[] = financingData?.financing_data || []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Solicitudes de Financiación</Heading>
        <Badge size="small">
          {financing.length} solicitudes
        </Badge>
      </div>

      <div className="px-6 py-8">
        {financing.length === 0 ? (
          <Text className="text-gray-500">No hay solicitudes de financiación todavía</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Contacto</Table.HeaderCell>
                <Table.HeaderCell>Producto</Table.HeaderCell>
                <Table.HeaderCell>Financiación</Table.HeaderCell>
                <Table.HeaderCell>Precio</Table.HeaderCell>
                <Table.HeaderCell>Fecha</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {financing.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <div>
                      <Text className="font-medium">{item.name}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1">
                      <Text size="small" className="">
                        Email: {item.email}
                      </Text>
                      <Text size="small" className="">
                        Teléfono: {item.phone}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-medium">{item.product}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small">
                      {item.months} meses
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-semibold text-green-600">
                      {formatPrice(item.price)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-gray-600">
                      {formatDate(item.requested_at)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Financiación",
})

export default FinancingPage