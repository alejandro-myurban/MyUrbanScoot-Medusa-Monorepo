import { useState, useMemo, useEffect } from "react";
import { FinancingData, FilterState, PaginationState } from "../types";
import { DEFAULT_FILTERS, ITEMS_PER_PAGE } from "../constants";
import { extractionHelpers } from "../utils/extractionHelpers";

export const useFinancingFilters = (data: FinancingData[]) => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Pre-calculate sorted data and sequential ID mapping
  const sortedDataWithSequentialIds = useMemo(() => {
    const sortedData = [...data].sort((a, b) => 
      new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime()
    );
    
    const sequentialIdMap = new Map<string, string>();
    sortedData.forEach((item, index) => {
      sequentialIdMap.set(item.id, (index + 1).toString().padStart(4, '0'));
    });
    
    return sequentialIdMap;
  }, [data]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.contractType, filters.searchTerm, filters.status, filters.contacted, filters.showCancelledDelivered]);

  // Memoize search results separately to avoid expensive recalculation
  const searchFilteredData = useMemo(() => {
    if (!filters.searchTerm.trim()) return data;
    
    const searchLower = filters.searchTerm.toLowerCase();
    return data.filter((item) => {
      const emailMatch = item.email.toLowerCase().includes(searchLower);
      const phoneMatch = item.phone_mumber.toLowerCase().includes(searchLower);
      const addressMatch = item.address && item.address.toLowerCase().includes(searchLower);
      const cityMatch = item.city && item.city.toLowerCase().includes(searchLower);
      const notesMatch = item.admin_notes && item.admin_notes.toLowerCase().includes(searchLower);
      
      // Buscar en los datos extraídos del DNI
      const dniInfo = extractionHelpers.extractDniInfo(item);
      const fullNameMatch = dniInfo.fullName && dniInfo.fullName.toLowerCase().includes(searchLower);
      const documentNumberMatch = dniInfo.documentNumber && dniInfo.documentNumber.toLowerCase().includes(searchLower);
      
      return emailMatch || phoneMatch || addressMatch || cityMatch || notesMatch || fullNameMatch || documentNumberMatch;
    });
  }, [data, filters.searchTerm]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return searchFilteredData.filter((item) => {
      // Contract type filter
      const matchesContractType = !filters.contractType || item.contract_type === filters.contractType;
      
      // Status filter
      const matchesStatus = !filters.status || item.status === filters.status;
      
      // Contacted filter
      let matchesContacted = true;
      if (filters.contacted === 'contacted') {
        matchesContacted = item.contacted === true;
      } else if (filters.contacted === 'not_contacted') {
        matchesContacted = item.contacted !== true;
      }

      // Show cancelled/delivered/denied filter
      let matchesShowCancelled = true;
      if (!filters.showCancelledDelivered) {
        matchesShowCancelled = item.status !== 'cancelled' && item.status !== 'delivered' && item.status !== 'denied';
      }

      return matchesContractType && matchesStatus && matchesContacted && matchesShowCancelled;
    });
  }, [searchFilteredData, filters.contractType, filters.status, filters.contacted, filters.showCancelledDelivered]);

  // Pagination calculations
  const pagination = useMemo<PaginationState>(() => {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    return {
      currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      totalPages,
      totalItems,
    };
  }, [filteredData.length, currentPage]);

  // Get paginated data with sequential IDs
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex).map((item) => {
      const sequentialId = sortedDataWithSequentialIds.get(item.id) || '0000';
      
      return {
        ...item,
        sequentialId
      };
    });
  }, [filteredData, currentPage, sortedDataWithSequentialIds]);

  // Update filters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  // Set specific filter values
  const setContractTypeFilter = (contractType: string) => {
    updateFilters({ contractType });
  };

  const setStatusFilter = (status: string) => {
    updateFilters({ status });
  };

  const setContactedFilter = (contacted: string) => {
    updateFilters({ contacted });
  };

  const setSearchTerm = (searchTerm: string) => {
    updateFilters({ searchTerm });
  };

  const setShowCancelledDelivered = (showCancelledDelivered: boolean) => {
    updateFilters({ showCancelledDelivered });
  };

  // Page navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Get filter summary
  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.contractType) activeFilters.push('Tipo de contrato');
    if (filters.status) activeFilters.push('Estado');
    if (filters.contacted) activeFilters.push('Contactado');
    if (filters.searchTerm) activeFilters.push('Búsqueda');
    if (!filters.showCancelledDelivered) activeFilters.push('Ocultar cancelados/entregados/denegados');

    return {
      hasActiveFilters: activeFilters.length > 0,
      activeFilters,
      totalCount: data.length,
      filteredCount: filteredData.length,
      showingCount: paginatedData.length
    };
  };

  return {
    // Filter state
    filters,
    updateFilters,
    clearFilters,
    
    // Individual filter setters
    setContractTypeFilter,
    setStatusFilter,
    setContactedFilter,
    setSearchTerm,
    setShowCancelledDelivered,
    
    // Data
    filteredData,
    paginatedData,
    
    // Pagination
    pagination,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    setCurrentPage,
    
    // Summary
    getFilterSummary,
  };
};