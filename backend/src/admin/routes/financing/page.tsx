import { Container, Text } from "@medusajs/ui";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard } from "lucide-react";

// Components
import FinancingListView from "./components/list/FinancingListView";
import FinancingDetailView from "./components/detail/FinancingDetailView";

// Hooks
import { useFinancingData } from "./hooks/useFinancingData";
import { useFinancingFilters } from "./hooks/useFinancingFilters";

// Types
import { FinancingData } from "./types";

const FinancingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequest, setSelectedRequest] = useState<FinancingData | null>(null);

  // Custom hooks handle all the logic
  const { data, isLoading, error, refetch, loadSpecificRequest, updateStatus, updateContacted } = useFinancingData();
  const { 
    filters, 
    paginatedData, 
    pagination,
    updateFilters,
    clearFilters,
    goToPage
  } = useFinancingFilters(data);

  // URL handling for direct links to specific requests
  useEffect(() => {
    const requestId = searchParams.get('id');
    if (requestId && !selectedRequest) {
      loadSpecificRequest(requestId).then((request) => {
        if (request) {
          setSelectedRequest(request);
        }
      });
    }
  }, [searchParams, selectedRequest, loadSpecificRequest]);

  // Reset selectedRequest when URL changes
  useEffect(() => {
    const requestId = searchParams.get('id');
    if (!requestId) {
      setSelectedRequest(null);
    }
  }, [searchParams]);

  // Handle request selection
  const handleSelectRequest = (request: FinancingData) => {
    setSearchParams({ id: request.id });
    setSelectedRequest(request);
  };

  // Handle back navigation
  const handleBack = () => {
    setSelectedRequest(null);
    setSearchParams({});
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  // Wrapper functions to match expected interface
  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus({ id, status });
  };

  const handleUpdateContacted = (id: string, contacted: boolean) => {
    updateContacted({ id, contacted });
  };

  // Loading state
  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <Text className="text-lg font-semibold">Solicitudes de Financiación</Text>
          </div>
        </div>
        <div className="px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <Text>Cargando solicitudes de financiación...</Text>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <Text className="text-lg font-semibold">Solicitudes de Financiación</Text>
          </div>
        </div>
        <div className="px-6 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️</div>
            <Text className="text-red-600 mb-4">
              Error al cargar las solicitudes de financiación
            </Text>
            <Text size="small" className="text-gray-500 mb-4">
              {error.message}
            </Text>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </Container>
    );
  }

  // Show detail view if a request is selected
  if (selectedRequest) {
    return (
      <FinancingDetailView
        request={selectedRequest}
        onBack={handleBack}
      />
    );
  }

  // Show main list view
  return (
    <FinancingListView
      data={paginatedData}
      filters={filters}
      pagination={{
        ...pagination,
        onPageChange: handlePageChange
      }}
      onSelectRequest={handleSelectRequest}
      onFiltersChange={updateFilters}
      onClearFilters={clearFilters}
      onUpdateStatus={handleUpdateStatus}
      onUpdateContacted={handleUpdateContacted}
      totalCount={data.length}
    />
  );
};

export const config = defineRouteConfig({
  label: "Financiación",
  icon: CreditCard,
});

export default FinancingPage;