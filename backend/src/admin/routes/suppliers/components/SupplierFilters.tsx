import React from "react";
import { Filter, Search } from "lucide-react";

interface SupplierFiltersProps {
  filterByStatus: string;
  searchTerm: string;
  onFilterByStatusChange: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onClearFilters: () => void;
}

export const SupplierFilters: React.FC<SupplierFiltersProps> = ({
  filterByStatus,
  searchTerm,
  onFilterByStatusChange,
  onSearchTermChange,
  onClearFilters,
}) => {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Filter className="w-4 h-4 text-gray-500" />
      <select
        value={filterByStatus}
        onChange={(e) => onFilterByStatusChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
      >
        <option value="">Todos los estados</option>
        <option value="active">✅ Activos</option>
        <option value="inactive">❌ Inactivos</option>
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, NIF o email"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm min-w-[250px]"
        />
      </div>
      {(filterByStatus || searchTerm) && (
        <button
          onClick={onClearFilters}
          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-700 underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
};

export default SupplierFilters;