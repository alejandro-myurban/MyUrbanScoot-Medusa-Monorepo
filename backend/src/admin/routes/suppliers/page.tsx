import { Container, Heading, Badge, Button } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";
import { Plus, Building } from "lucide-react";
import { sdk } from "../../lib/sdk";
import { Supplier, SupplierOrder } from "./types";
import SupplierFilters from "./components/SupplierFilters";
import SuppliersTable from "./components/SuppliersTable";
import SupplierDetailView from "./components/SupplierDetailView";
import SupplierForm from "./components/SupplierForm";
import Pagination from "./components/Pagination";

const SuppliersPage = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [filterByStatus, setFilterByStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();

  // Formulario de creación/edición
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: "",
    legal_name: "",
    tax_id: "",
    email: "",
    phone: "",
    website: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    postal_code: "",
    province: "",
    country_code: "ES",
    payment_terms: "30",
    currency_code: "EUR",
    discount_percentage: 0,
    is_active: true
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterByStatus, searchTerm]);

  const {
    data: suppliersData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/suppliers", {
        method: "GET",
      });
      return response as { suppliers: Supplier[] };
    },
  });

  const {
    data: ordersData,
    isLoading: isLoadingOrders,
  } = useQuery<{ orders: SupplierOrder[] }>({
    queryKey: ["supplier-orders", selectedSupplier?.id],
    queryFn: async () => {
      if (!selectedSupplier?.id) return { orders: [] };
      const response = await sdk.client.fetch(`/admin/suppliers/${selectedSupplier.id}/orders`, {
        method: "GET",
      });
      return response as { orders: SupplierOrder[] };
    },
    enabled: !!selectedSupplier?.id
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: Partial<Supplier>) => {
      const response = await sdk.client.fetch("/admin/suppliers", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      alert("Error al crear el proveedor: " + error.message);
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Supplier> }) => {
      const response = await sdk.client.fetch(`/admin/suppliers/${id}`, {
        method: "PUT",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setSelectedSupplier(null);
      resetForm();
    },
    onError: (error: any) => {
      alert("Error al actualizar el proveedor: " + error.message);
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/suppliers/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      alert("Error al desactivar el proveedor: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      legal_name: "",
      tax_id: "",
      email: "",
      phone: "",
      website: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      postal_code: "",
      province: "",
      country_code: "ES",
      payment_terms: "30",
      currency_code: "EUR",
      discount_percentage: 0,
      is_active: true
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier);
    setShowCreateForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.id) {
      updateSupplierMutation.mutate({ id: formData.id, data: formData });
    } else {
      createSupplierMutation.mutate(formData);
    }
  };

  const handleClearFilters = () => {
    setFilterByStatus("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Gestión de Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          Cargando proveedores...
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Gestión de Proveedores</Heading>
        </div>
        <div className="px-6 py-8">
          <span className="text-red-500">Error al cargar los proveedores</span>
        </div>
      </Container>
    );
  }

  const suppliers: Supplier[] = suppliersData?.suppliers || [];
  const orders: SupplierOrder[] = ordersData?.orders || [];

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesStatus = !filterByStatus || 
      (filterByStatus === "active" && supplier.is_active) ||
      (filterByStatus === "inactive" && !supplier.is_active);

    const matchesSearch = !searchTerm.trim() || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);


  if (selectedSupplier) {
    return (
      <SupplierDetailView
        supplier={selectedSupplier}
        orders={orders}
        isLoadingOrders={isLoadingOrders}
        onBack={() => setSelectedSupplier(null)}
        onEdit={handleEdit}
      />
    );
  }

  if (showCreateForm) {
    return (
      <SupplierForm
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={() => { setShowCreateForm(false); resetForm(); }}
        isSubmitting={createSupplierMutation.isPending || updateSupplierMutation.isPending}
        isEditing={!!formData.id}
      />
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Gestión de Proveedores</Heading>
        <div className="flex items-center gap-2">
          <Badge size="small">
            {filteredSuppliers.length}{" "}
            {filteredSuppliers.length === suppliers.length ? "proveedores" : `de ${suppliers.length} proveedores`}
          </Badge>
          <Button variant="primary" size="small" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      <div className="px-6 py-4">
        <SupplierFilters
          filterByStatus={filterByStatus}
          searchTerm={searchTerm}
          onFilterByStatusChange={setFilterByStatus}
          onSearchTermChange={setSearchTerm}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className="px-6 py-8">
        <SuppliersTable
          suppliers={paginatedSuppliers}
          onViewSupplier={setSelectedSupplier}
          onEditSupplier={handleEdit}
          onDeleteSupplier={(id) => deleteSupplierMutation.mutate(id)}
          onCreateSupplier={() => setShowCreateForm(true)}
          isDeleting={deleteSupplierMutation.isPending}
          totalSuppliers={suppliers.length}
          hasFilters={!!(filterByStatus || searchTerm)}
        />

        {filteredSuppliers.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSuppliers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="proveedores"
          />
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Proveedores",
  icon: Building,
});

export default SuppliersPage;