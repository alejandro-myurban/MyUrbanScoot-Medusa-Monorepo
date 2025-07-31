import { Container, Heading, Table, Badge, Text, Button } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState } from "react";
import { Eye, Download, Filter } from "lucide-react";
import { sdk } from "../../lib/sdk";

type FinancingData = {
  id: string;
  email: string;
  identity: string;
  income: string;
  paysheet_file_id: string | null;
  contract_type: string;
  company_position: string | null;
  company_start_date: string | null;
  freelance_rental_file_id: string | null;
  freelance_quote_file_id: string | null;
  pensioner_proof_file_id: string | null;
  bank_account_proof_file_id: string | null;
  financing_installment_count: string;
  housing_type: string;
  housing_type_details: string | null;
  civil_status: string;
  marital_status_details: string | null;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  phone_mumber: string;
  doubts: string | null;
  requested_at: string;
  created_at: string;
};

const FinancingPage = () => {
  const [selectedRequest, setSelectedRequest] = useState<FinancingData | null>(
    null
  );
  const [filterByContractType, setFilterByContractType] = useState<string>("");

  const {
    data: financingData,
    isLoading,
    error,
  } = useQuery<{ financing_data: FinancingData[] }>({
    queryKey: ["financing-data"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/financing-data", {
        method: "GET",
      });
      return response as { financing_data: FinancingData[] };
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatIncome = (income: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(Number(income));
  };

  const getContractTypeLabel = (type: string) => {
    const labels = {
      employee: "Empleado",
      freelance: "Autónomo",
      pensioner: "Pensionista",
      unemployed: "Desempleado",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getContractTypeBadgeColor = (type: string) => {
    const colors = {
      employee: "bg-blue-100 text-blue-800",
      freelance: "bg-green-100 text-green-800",
      pensioner: "bg-purple-100 text-purple-800",
      unemployed: "bg-red-100 text-red-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getCivilStatusLabel = (status: string) => {
    const labels = {
      single: "Soltero/a",
      married: "Casado/a",
      divorced: "Divorciado/a",
      widowed: "Viudo/a",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getHousingTypeLabel = (type: string) => {
    const labels = {
      rent: "Alquiler",
      owned: "Propia (con hipoteca)",
      owned_free: "Propia (sin hipoteca)",
      family: "Familiar",
      other: "Otra",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const hasDocuments = (request: FinancingData) => {
    const docs = [
      request.paysheet_file_id,
      request.freelance_rental_file_id,
      request.freelance_quote_file_id,
      request.pensioner_proof_file_id,
      request.bank_account_proof_file_id,
    ];
    return docs.filter(Boolean).length;
  };

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
    );
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
    );
  }

  const financing: FinancingData[] = financingData?.financing_data || [];

  // Filtrar por tipo de contrato si está seleccionado
  const filteredFinancing = filterByContractType
    ? financing.filter((item) => item.contract_type === filterByContractType)
    : financing;

  if (selectedRequest) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSelectedRequest(null)}
            >
              ← Volver
            </Button>
            <Heading level="h2">Detalle de Solicitud</Heading>
          </div>
          <Badge size="small">ID: {selectedRequest.id.slice(-8)}</Badge>
        </div>

        <div className="px-6 py-8 space-y-8">
          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Información Personal
              </Heading>
              <div className="space-y-2">
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Email
                  </Text>
                  <Text className="font-medium">{selectedRequest.email}</Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Teléfono
                  </Text>
                  <Text className="font-medium">
                    {selectedRequest.phone_mumber}
                  </Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Estado Civil
                  </Text>
                  <Text className="font-medium">
                    {getCivilStatusLabel(selectedRequest.civil_status)}
                  </Text>
                  {selectedRequest.marital_status_details && (
                    <Text size="small" className="text-gray-500">
                      {selectedRequest.marital_status_details}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Domicilio
              </Heading>
              <div className="space-y-2">
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Dirección
                  </Text>
                  <Text className="font-medium">{selectedRequest.address}</Text>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text size="small" className="text-gray-600 dark:text-gray-400">
                      Código Postal
                    </Text>
                    <Text className="font-medium">
                      {selectedRequest.postal_code}
                    </Text>
                  </div>
                  <div>
                    <Text size="small" className="text-gray-600 dark:text-gray-400">
                      Ciudad
                    </Text>
                    <Text className="font-medium">{selectedRequest.city}</Text>
                  </div>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Provincia
                  </Text>
                  <Text className="font-medium">
                    {selectedRequest.province}
                  </Text>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Tipo de Vivienda
                  </Text>
                  <Text className="font-medium">
                    {getHousingTypeLabel(selectedRequest.housing_type)}
                  </Text>
                  {selectedRequest.housing_type_details && (
                    <Text size="small" className="text-gray-500">
                      {selectedRequest.housing_type_details}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información Laboral y Financiera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Información Laboral
              </Heading>
              <div className="space-y-2">
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Tipo de Contrato
                  </Text>
                  <Badge
                    className={getContractTypeBadgeColor(
                      selectedRequest.contract_type
                    )}
                  >
                    {getContractTypeLabel(selectedRequest.contract_type)}
                  </Badge>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Ingresos Mensuales
                  </Text>
                  <Text className="font-semibold text-green-600 text-lg">
                    {formatIncome(selectedRequest.income)}
                  </Text>
                </div>
                {selectedRequest.company_position && (
                  <div>
                    <Text size="small" className="text-gray-600 dark:text-gray-400">
                      Cargo
                    </Text>
                    <Text className="font-medium">
                      {selectedRequest.company_position}
                    </Text>
                  </div>
                )}
                {selectedRequest.company_start_date && (
                  <div>
                    <Text size="small" className="text-gray-600 dark:text-gray-400">
                      Fecha de inicio
                    </Text>
                    <Text className="font-medium">
                      {formatDate(selectedRequest.company_start_date)}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Financiación
              </Heading>
              <div className="space-y-2">
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Plazos Solicitados
                  </Text>
                  <Badge size="large">
                    {selectedRequest.financing_installment_count} meses
                  </Badge>
                </div>
                <div>
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Fecha de Solicitud
                  </Text>
                  <Text className="font-medium">
                    {formatDate(selectedRequest.requested_at)}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">
              Documentación
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Text size="small" className="text-gray-600 dark:text-gray-400">
                  DNI/NIE
                </Text>
                {selectedRequest.identity ? (
                  <a
                    href={selectedRequest.identity}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2  text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver documento
                  </a>
                ) : (
                  <Text size="small" className="text-gray-400">
                    No disponible
                  </Text>
                )}
              </div>

              {selectedRequest.paysheet_file_id && (
                <div className="space-y-2">
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Nómina
                  </Text>
                  <a
                    href={selectedRequest.paysheet_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver nómina
                  </a>
                </div>
              )}

              {selectedRequest.freelance_rental_file_id && (
                <div className="space-y-2">
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Declaración de la Renta
                  </Text>
                  <a
                    href={selectedRequest.freelance_rental_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver declaración
                  </a>
                </div>
              )}

              {selectedRequest.freelance_quote_file_id && (
                <div className="space-y-2">
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Cuota de Autónomos
                  </Text>
                  <a
                    href={selectedRequest.freelance_quote_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver cuota
                  </a>
                </div>
              )}

              {selectedRequest.pensioner_proof_file_id && (
                <div className="space-y-2">
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Justificante de Pensión
                  </Text>
                  <a
                    href={selectedRequest.pensioner_proof_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2  text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver justificante
                  </a>
                </div>
              )}

              {selectedRequest.bank_account_proof_file_id && (
                <div className="space-y-2">
                  <Text size="small" className="text-gray-600 dark:text-gray-400">
                    Justificante Bancario
                  </Text>
                  <a
                    href={selectedRequest.bank_account_proof_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2  text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver justificante
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Comentarios */}
          {selectedRequest.doubts && (
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Comentarios del Cliente
              </Heading>
              <div className="bg-gray-50 dark:bg-gray-300 dark:text-black p-4 rounded-lg">
                <Text>{selectedRequest.doubts}</Text>
              </div>
            </div>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Solicitudes de Financiación</Heading>
        <div className="flex items-center gap-2">
          <Badge size="small">{filteredFinancing.length} solicitudes</Badge>
          <Button variant="secondary" size="small">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 ">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterByContractType}
            onChange={(e) => setFilterByContractType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los tipos de contrato</option>
            <option value="employee">Empleados</option>
            <option value="freelance">Autónomos</option>
            <option value="pensioner">Pensionistas</option>
            <option value="unemployed">Desempleados</option>
          </select>
        </div>
      </div>

      <div className="px-6 py-8">
        {filteredFinancing.length === 0 ? (
          <Text className="text-gray-500">
            {filterByContractType
              ? `No hay solicitudes para el tipo de contrato seleccionado`
              : `No hay solicitudes de financiación todavía`}
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Contacto</Table.HeaderCell>
                <Table.HeaderCell>Trabajo</Table.HeaderCell>
                <Table.HeaderCell>Ingresos</Table.HeaderCell>
                <Table.HeaderCell>Financiación</Table.HeaderCell>
                <Table.HeaderCell>Documentos</Table.HeaderCell>
                <Table.HeaderCell>Fecha</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredFinancing.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <div className="space-y-1">
                      <Text className="font-medium">{item.email}</Text>
                      <Text size="small" className="text-gray-400">
                        {item.city}, {item.province}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1">
                      <Text size="small">📧 {item.email}</Text>
                      <Text size="small">📞 {item.phone_mumber}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1 p-2">
                      <Badge
                        className={getContractTypeBadgeColor(
                          item.contract_type
                        )}
                        size="small"
                      >
                        {getContractTypeLabel(item.contract_type)}
                      </Badge>
                      {item.company_position && (
                        <Text size="small" className="text-gray-400">
                          {item.company_position}
                        </Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-semibold text-green-600">
                      {formatIncome(item.income)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small">
                      {item.financing_installment_count} meses
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small">{hasDocuments(item)} docs</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-gray-400">
                      {formatDate(item.requested_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setSelectedRequest(item)}
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Financiación",
});

export default FinancingPage;
