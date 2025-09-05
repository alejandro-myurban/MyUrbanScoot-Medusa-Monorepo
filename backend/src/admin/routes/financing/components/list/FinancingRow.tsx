import { Table, Badge, Text, Button } from "@medusajs/ui";
import { Eye, Download } from "lucide-react";
import { FinancingRowProps } from "../../types";
import { formatters } from "../../utils/formatters";
import { documentHelpers } from "../../utils/documentHelpers";
import StatusBadge from "../shared/StatusBadge";
import ContactedBadge from "../shared/ContactedBadge";
import SequentialIdDisplay from "../shared/SequentialIdDisplay";

const FinancingRow = ({ item, sequentialId, onView, onDownload }: FinancingRowProps) => {
  const documentCount = documentHelpers.hasDocuments(item);
  
  return (
    <Table.Row key={item.id}>
      {/* Sequential ID */}
      <Table.Cell>
        <SequentialIdDisplay sequentialId={sequentialId} />
      </Table.Cell>

      {/* Date */}
      <Table.Cell>
        <Text size="small">
          {formatters.date(item.requested_at)}
        </Text>
      </Table.Cell>

      {/* Email */}
      <Table.Cell>
        <Text className="font-medium">
          {item.email}
        </Text>
        <Text size="small" className="text-gray-500">
          {formatters.phone(item.phone_mumber)}
        </Text>
      </Table.Cell>

      {/* Contract Type */}
      <Table.Cell>
        <Badge size="small" className="text-black dark:text-white border-black">
          {formatters.contractType(item.contract_type)}
        </Badge>
        {item.company_position && (
          <Text size="small" className="text-gray-400 mt-1">
            {item.company_position}
          </Text>
        )}
      </Table.Cell>

      {/* Income */}
      <Table.Cell>
        <Text className="font-semibold text-green-600">
          {formatters.currency(parseFloat(item.income))}
        </Text>
      </Table.Cell>

      {/* Installments */}
      <Table.Cell>
        <Text size="small">
          {formatters.installments(item.financing_installment_count)}
        </Text>
      </Table.Cell>

      {/* Status */}
      <Table.Cell>
        <StatusBadge status={item.status || 'pending'} size="small" />
      </Table.Cell>

      {/* Contacted */}
      <Table.Cell>
        <ContactedBadge contacted={item.contacted} />
      </Table.Cell>

      {/* Documents */}
      <Table.Cell>
        <Text size="small" className="text-center">
          {documentCount > 0 ? (
            <span className="text-green-600">{documentCount} docs</span>
          ) : (
            <span className="text-gray-400">Sin docs</span>
          )}
        </Text>
      </Table.Cell>

      {/* Actions */}
      <Table.Cell>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => onView(item)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          {documentCount > 0 && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onDownload(item)}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};

export default FinancingRow;