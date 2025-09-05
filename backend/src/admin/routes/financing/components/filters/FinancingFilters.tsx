import { Button, Badge, Text } from "@medusajs/ui";
import { Filter } from "lucide-react";
import { FinancingFiltersProps } from "../../types";
import StatusFilter from "./StatusFilter";
import ContractTypeFilter from "./ContractTypeFilter";
import ContactedFilter from "./ContactedFilter";
import SearchFilter from "./SearchFilter";
import ShowCancelledFilter from "./ShowCancelledFilter";

const FinancingFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalCount,
  filteredCount
}: FinancingFiltersProps) => {
  const hasActiveFilters = filters.contractType || filters.status || filters.contacted || filters.searchTerm || !filters.showCancelledDelivered;

  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <Text className="font-medium text-gray-700">Filtros</Text>
        <Badge size="small" className="ml-2">
          {filteredCount} de {totalCount}
        </Badge>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="small"
            onClick={onClearFilters}
            className="ml-auto"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* Search */}
        <SearchFilter
          value={filters.searchTerm}
          onChange={(searchTerm) => onFiltersChange({ searchTerm })}
          className="lg:col-span-2"
        />

        {/* Status Filter */}
        <StatusFilter
          value={filters.status}
          onChange={(status) => onFiltersChange({ status })}
        />

        {/* Contract Type Filter */}
        <ContractTypeFilter
          value={filters.contractType}
          onChange={(contractType) => onFiltersChange({ contractType })}
        />

        {/* Contacted Filter */}
        <ContactedFilter
          value={filters.contacted}
          onChange={(contacted) => onFiltersChange({ contacted })}
        />
      </div>

      <div className="mt-3 flex items-center">
        <ShowCancelledFilter
          checked={filters.showCancelledDelivered}
          onChange={(showCancelledDelivered) => onFiltersChange({ showCancelledDelivered })}
        />
      </div>
    </div>
  );
};

export default FinancingFilters;