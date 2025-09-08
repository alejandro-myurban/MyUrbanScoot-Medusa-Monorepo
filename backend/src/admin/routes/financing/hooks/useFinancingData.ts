import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../../../lib/sdk";
import { FinancingData } from "../types";

export const useFinancingData = () => {
  const queryClient = useQueryClient();

  // Main query to fetch all financing data
  const {
    data: financingData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ financing_data: FinancingData[] }>({
    queryKey: ["financing-data"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/financing-data", {
        method: "GET",
      });
      return response as { financing_data: FinancingData[] };
    },
  });

  // Query to load specific request by ID
  const loadSpecificRequest = async (requestId: string): Promise<FinancingData | null> => {
    try {
      const response = await sdk.client.fetch(`/admin/financing-data/${requestId}`, {
        method: "GET",
      });
      return (response as { financing_request: FinancingData }).financing_request;
    } catch (error) {
      console.error("Error loading specific request:", error);
      return null;
    }
  };

  // Mutation to update field
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const response = await sdk.client.fetch(`/admin/financing-data/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: { [field]: value },
      });
      return response;
    },
    onMutate: async ({ id, field, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["financing-data"] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["financing-data"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["financing-data"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          financing_data: oldData.financing_data.map((item: FinancingData) => 
            item.id === id 
              ? { ...item, [field]: value }
              : item
          )
        };
      });
      
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating field:", error);
      alert("Error al actualizar el campo: " + error.message);
      
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["financing-data"], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["financing-data"] });
    }
  });

  // Mutation to update status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await sdk.client.fetch(`/admin/financing-data/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: { status },
      });
      return response;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["financing-data"] });
      const previousData = queryClient.getQueryData(["financing-data"]);
      
      queryClient.setQueryData(["financing-data"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          financing_data: oldData.financing_data.map((item: FinancingData) => 
            item.id === id 
              ? { ...item, status }
              : item
          )
        };
      });
      
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating status:", error);
      alert("Error al actualizar el estado: " + error.message);
      
      if (context?.previousData) {
        queryClient.setQueryData(["financing-data"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-data"] });
    }
  });

  // Mutation to update contacted status
  const updateContactedMutation = useMutation({
    mutationFn: async ({ id, contacted }: { id: string; contacted: boolean }) => {
      const response = await sdk.client.fetch(`/admin/financing-data/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: { contacted },
      });
      return response;
    },
    onMutate: async ({ id, contacted }) => {
      await queryClient.cancelQueries({ queryKey: ["financing-data"] });
      const previousData = queryClient.getQueryData(["financing-data"]);
      
      queryClient.setQueryData(["financing-data"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          financing_data: oldData.financing_data.map((item: FinancingData) => 
            item.id === id 
              ? { ...item, contacted }
              : item
          )
        };
      });
      
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating contacted status:", error);
      alert("Error al actualizar el estado de contacto: " + error.message);
      
      if (context?.previousData) {
        queryClient.setQueryData(["financing-data"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-data"] });
    }
  });

  // Mutation to update admin notes
  const updateAdminNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const response = await sdk.client.fetch(`/admin/financing-data/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: { admin_notes: notes },
      });
      return response;
    },
    onMutate: async ({ id, notes }) => {
      await queryClient.cancelQueries({ queryKey: ["financing-data"] });
      const previousData = queryClient.getQueryData(["financing-data"]);
      
      queryClient.setQueryData(["financing-data"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          financing_data: oldData.financing_data.map((item: FinancingData) => 
            item.id === id 
              ? { ...item, admin_notes: notes }
              : item
          )
        };
      });
      
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating admin notes:", error);
      alert("Error al actualizar las notas: " + error.message);
      
      if (context?.previousData) {
        queryClient.setQueryData(["financing-data"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-data"] });
    }
  });

  return {
    // Data
    data: financingData?.financing_data || [],
    isLoading,
    error,
    refetch,
    
    // Methods
    loadSpecificRequest,
    
    // Mutations
    updateField: updateFieldMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    updateContacted: updateContactedMutation.mutate,
    updateAdminNotes: updateAdminNotesMutation.mutate,
    
    // Loading states
    isUpdatingField: updateFieldMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isUpdatingContacted: updateContactedMutation.isPending,
    isUpdatingNotes: updateAdminNotesMutation.isPending,
  };
};