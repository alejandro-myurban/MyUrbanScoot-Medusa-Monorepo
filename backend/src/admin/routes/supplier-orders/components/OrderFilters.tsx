import React from "react";
import { Filter, Search } from "lucide-react";
import { Supplier } from "../types";

interface OrderFiltersProps {
  filterByStatus: string;
  filterBySupplier: string;
  searchTerm: string;
  suppliers: Supplier[];
  onFilterByStatus: (status: string) => void;
  onFilterBySupplier: (supplierId: string) => void;
  onSearchTerm: (term: string) => void;
  onClearFilters: () => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filterByStatus,
  filterBySupplier,
  searchTerm,
  suppliers,
  onFilterByStatus,
  onFilterBySupplier,
  onSearchTerm,
  onClearFilters,
}) => {
  const hasActiveFilters = filterByStatus || filterBySupplier || searchTerm;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        
        {/* Status Filter */}
        <select
          value={filterByStatus}
          onChange={(e) => onFilterByStatus(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="draft">📝 Borradores</option>
          <option value="pending">⏳ Pendientes</option>
          <option value="confirmed">✅ Confirmados</option>
          <option value="shipped">🚚 Enviados</option>
          <option value="partially_received">📦 Parcialmente recibidos</option>
          <option value="received">✅ Recibidos</option>
          <option value="incident">🚨 Con Incidencias</option>
          <option value="cancelled">❌ Cancelados</option>
        </select>
        
        {/* Supplier Filter */}
        <select
          value={filterBySupplier}
          onChange={(e) => onFilterBySupplier(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Todos los proveedores</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, proveedor o referencia"
            value={searchTerm}
            onChange={(e) => onSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm min-w-[250px]"
          />
        </div>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;