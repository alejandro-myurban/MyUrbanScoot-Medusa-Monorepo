import { Container, Heading, Badge } from "@medusajs/ui";
import { FinancingData, FilterState, PaginationState } from "../../types";
import { documentHelpers } from "../../utils/documentHelpers";
import FinancingFilters from "../filters/FinancingFilters";
import FinancingTable from "./FinancingTable";

interface FinancingListViewProps {
  data: FinancingData[];
  filters: FilterState;
  pagination: PaginationState & { onPageChange: (page: number) => void };
  onSelectRequest: (request: FinancingData) => void;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateContacted: (id: string, contacted: boolean) => void;
  totalCount: number;
}

const FinancingListView = ({
  data,
  filters,
  pagination,
  onSelectRequest,
  onFiltersChange,
  onClearFilters,
  onUpdateStatus,
  onUpdateContacted,
  totalCount
}: FinancingListViewProps) => {
  const handleDownloadDocuments = async (request: FinancingData) => {
    try {
      await documentHelpers.downloadAll(request);
    } catch (error) {
      console.error('Error downloading documents:', error);
    }
  };

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Solicitudes de Financiación</Heading>
        <Badge size="small">
          {pagination.totalItems} solicitudes
        </Badge>
      </div>

      {/* Filters */}
      <FinancingFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
        totalCount={totalCount}
        filteredCount={pagination.totalItems}
      />

      {/* Table */}
      <div className="px-6 py-8">
        <FinancingTable
          data={data}
          onSelectRequest={onSelectRequest}
          onDownloadDocuments={handleDownloadDocuments}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          onUpdateStatus={onUpdateStatus}
          onUpdateContacted={onUpdateContacted}
        />
      </div>
    </Container>
  );
};

export default FinancingListView;