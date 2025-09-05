import { Table, Text, Badge, Button } from "@medusajs/ui";
import { FileX, Eye, Download } from "lucide-react";
import { FinancingTableProps } from "../../types";
import { formatters } from "../../utils/formatters";
import { documentHelpers } from "../../utils/documentHelpers";
import { extractionHelpers } from "../../utils/extractionHelpers";
import {
  STATUS_COLORS,
  STATUS_ICONS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_COLORS,
} from "../../constants";
import Pagination from "./Pagination";

const FinancingTable = ({
  data,
  onSelectRequest,
  onDownloadDocuments,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateStatus,
  onUpdateContacted,
}: FinancingTableProps & {
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateContacted: (id: string, contacted: boolean) => void;
}) => {
  // Helper functions from original code
  const getSequentialId = (item: any) => {
    return item.sequentialId || "0001";
  };

  const getStatusColor = (status: string) => {
    return (
      STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
      STATUS_COLORS.pending
    );
  };

  const getStatusIcon = (status: string) => {
    return STATUS_ICONS[status as keyof typeof STATUS_ICONS] || "";
  };

  const getContractTypeLabel = (type: string) => {
    return (
      CONTRACT_TYPE_LABELS[type as keyof typeof CONTRACT_TYPE_LABELS] || type
    );
  };

  const getContractTypeBadgeColor = (type: string) => {
    return (
      CONTRACT_TYPE_COLORS[type as keyof typeof CONTRACT_TYPE_COLORS] ||
      "bg-gray-100 text-gray-800"
    );
  };

  const formatIncome = (income: string) => {
    return formatters.currency(parseFloat(income));
  };

  const formatDate = (dateString: string) => {
    return formatters.date(dateString);
  };

  const hasDocuments = (item: any) => {
    return documentHelpers.hasDocuments(item);
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <FileX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <Text className="text-gray-500">
          No se encontraron solicitudes de financiación
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell className="w-16 min-w-16">#ID</Table.HeaderCell>
            <Table.HeaderCell className="w-36 min-w-36">Estado</Table.HeaderCell>
            <Table.HeaderCell className="w-32 min-w-32">Contactado</Table.HeaderCell>
            <Table.HeaderCell className="w-32 min-w-32">DNI</Table.HeaderCell>
            {/* <Table.HeaderCell className="w-48 min-w-48">Cliente</Table.HeaderCell> */}
            <Table.HeaderCell className="w-48 min-w-48">Contacto</Table.HeaderCell>
            <Table.HeaderCell className="w-32 min-w-32">Trabajo</Table.HeaderCell>
            <Table.HeaderCell className="w-24 min-w-24">Ingresos</Table.HeaderCell>
            {/* <Table.HeaderCell className="w-20 min-w-20">Fin.</Table.HeaderCell> */}
            {/* <Table.HeaderCell className="w-16 min-w-16">Docs</Table.HeaderCell> */}
            <Table.HeaderCell className="w-24 min-w-24">Acciones</Table.HeaderCell>
            <Table.HeaderCell className="w-32 min-w-32">Fecha</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data.map((item, index) => {
            const dniInfo = extractionHelpers.extractDniInfo(item);

            return (
              <Table.Row key={item.id || `no-id-${index}`}>
                <Table.Cell className="w-16 min-w-16">
                  <Text size="small" className="font-mono text-gray-400">
                    #{getSequentialId(item)}
                  </Text>
                </Table.Cell>

                <Table.Cell className="w-36 min-w-36">
                  <select
                    value={item.status || "pending"}
                    onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded border ${getStatusColor(
                      item.status || "pending"
                    )} cursor-pointer`}
                    disabled={!item.id || item.id.trim() === ""}
                  >
                    <option value="pending">
                      {getStatusIcon("pending")} Sin gestionar
                    </option>
                    <option value="budgeted">
                      {getStatusIcon("budgeted")} Presupuestado
                    </option>
                    <option value="missing_docs">
                      {getStatusIcon("missing_docs")} Falta documentación
                    </option>
                    <option value="denied">
                      {getStatusIcon("denied")} Denegado
                    </option>
                    <option value="cancelled">
                      {getStatusIcon("cancelled")} Cancelada
                    </option>
                    <option value="pre_accepted">
                      {getStatusIcon("pre_accepted")} Preaceptada
                    </option>
                    <option value="under_review">
                      {getStatusIcon("under_review")} En revisión
                    </option>
                    <option value="in_force">
                      {getStatusIcon("in_force")} En vigor
                    </option>
                    <option value="in_software">
                      {getStatusIcon("in_software")} En software
                    </option>
                    <option value="delivered">
                      {getStatusIcon("delivered")} Entregado
                    </option>
                  </select>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.contacted || false}
                      onChange={(e) =>
                        onUpdateContacted(item.id, e.target.checked)
                      }
                      disabled={!item.id || item.id.trim() === ""}
                      className="w-4 h-4 text-green-500 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {item.contacted ? "Contactado" : "No contactado"}
                    </span>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <div className="space-y-1">
                    <Text size="small" className="font-mono">
                      {dniInfo.documentNumber || "No extraído"}
                    </Text>
                    {dniInfo.fullName && (
                      <Text size="small" className="text-gray-400">
                        {dniInfo.fullName}
                      </Text>
                    )}
                  </div>
                </Table.Cell>

                {/* <Table.Cell className="w-16 max-w-16">
                  <div className="space-y-1">
                    <Text className="font-medium truncate">{item.email}</Text>
                    <Text size="small" className="text-gray-400 truncate">
                      {item.city}, {item.province}
                    </Text>
                  </div>
                </Table.Cell> */}

                <Table.Cell className="w-24 max-w-24">
                  <div className="space-y-1">
                    <Text size="small" className="truncate">
                      📧 {item.email}
                    </Text>
                    <Text size="small" className="truncate">
                      📞 {item.phone_mumber}
                    </Text>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <div className="space-y-1 p-2 max-w-40">
                    <Badge
                      className={`${getContractTypeBadgeColor(item.contract_type)} text-xs px-2 py-1 max-w-full truncate`}
                      size="small"
                    >
                      {getContractTypeLabel(item.contract_type)}
                    </Badge>
                    {item.company_position && (
                      <Text size="small" className="text-gray-400 truncate">
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

                {/* <Table.Cell>
                  <Text className="">{item.financing_installment_count} meses</Text>
                </Table.Cell> */}

                {/* <Table.Cell>
                  <Badge size="small" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    {hasDocuments(item)}
                  </Badge>
                </Table.Cell> */}

                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => onSelectRequest(item)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {hasDocuments(item) > 0 && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onDownloadDocuments(item)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <Text size="small" className="text-gray-400">
                    {formatDate(item.requested_at)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
          </Table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={data.length}
        itemsPerPage={30}
        onPageChange={onPageChange}
        itemLabel="solicitudes"
      />
    </div>
  );
};

export default FinancingTable;
