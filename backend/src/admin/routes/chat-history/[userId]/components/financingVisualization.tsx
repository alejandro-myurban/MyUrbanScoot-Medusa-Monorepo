"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; 
import { sdk } from "../../../../lib/sdk";

type FinancingData = {
  id: string;
  email: string;
  identity_front_file_id: string;
  identity_back_file_id: string;
  income: string;
  paysheet_file_id?: string;
  contract_type?: string;
  company_position?: string;
  company_start_date?: string;
  freelance_rental_file_id?: string;
  freelance_quote_file_id?: string;
  freelance_start_date?: string;
  pensioner_proof_file_id?: string;
  bank_account_proof_file_id?: string;
  financing_installment_count: string;
  housing_type: string;
  housing_type_details?: string;
  civil_status: string;
  marital_status_details?: string;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  phone_mumber: string; 
  doubts?: string;
  requested_at: string;
  dni_front_verification?: any;
  dni_back_verification?: any;
  payroll_verification?: any;
  bank_verification?: any;
  status: string;
  admin_notes?: string;
  contacted: boolean;
};

type Props = {
  userId: string; 
};

const FinancingVisualization = ({ userId }: Props) => {
  const [userFinancing, setUserFinancing] = useState<FinancingData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate(); 

  const {
    data: financingData,
    isLoading,
    error,
  } = useQuery<{ financing_data: FinancingData[] }>({
    queryKey: ["financing-data"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/financing-data", {
        method: "GET",
      });
      return response as { financing_data: FinancingData[] };
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (currentUserId !== userId) {
      console.log(`🔄 [FinancingVisualization] Cambio de usuario: ${currentUserId} → ${userId}`);
      setUserFinancing(null);
      setCurrentUserId(userId);
    }
  }, [userId, currentUserId]);

  useEffect(() => {
    if (!financingData?.financing_data || !userId || currentUserId !== userId) {
      return;
    }

    console.log(`🔍 [FinancingVisualization] Buscando financiación para usuario: ${userId}`);

    const cleanPhoneNumber = (phone: string): string => {
      // Eliminar "whatsapp:" y otros caracteres no numéricos
      let cleaned = phone.replace(/^whatsapp:|[\s\-\(\)\+]/g, '');

      // Si empieza con el código de país de España '34', lo elimina
      if (cleaned.startsWith('34')) {
        cleaned = cleaned.substring(2);
      }

      // Asegurar que solo queden 9 dígitos
      if (cleaned.length > 9) {
        cleaned = cleaned.substring(cleaned.length - 9);
      }
      
      return cleaned;
    };

    const cleanedUserId = cleanPhoneNumber(userId);
    console.log(`📞 [FinancingVisualization] Usuario limpio: ${cleanedUserId}`);

    const matchingFinancing = financingData.financing_data.find(financing => {
      const cleanedFinancingPhone = cleanPhoneNumber(financing.phone_mumber);
      console.log(`📞 [FinancingVisualization] Comparando: ${cleanedUserId} vs ${cleanedFinancingPhone}`);
      return cleanedFinancingPhone === cleanedUserId;
    });

    if (matchingFinancing) {
      console.log(`✅ [FinancingVisualization] Financiación encontrada para ${userId}:`, {
        id: matchingFinancing.id,
        status: matchingFinancing.status,
        requested_at: matchingFinancing.requested_at,
        email: matchingFinancing.email
      });
      setUserFinancing(matchingFinancing);
    } else {
      console.log(`❌ [FinancingVisualization] No se encontró financiación para ${userId}`);
      setUserFinancing(null);
    }
  }, [financingData, userId, currentUserId]);

  if (isLoading) {
    return null;
  }

  if (error) {
    console.error('[FinancingVisualization] Error al cargar datos de financiación:', error);
    return null;
  }

  if (!userFinancing || currentUserId !== userId) {
    return null;
  }

  const getBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'orange';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'in_review':
        return 'blue';
      default:
        return 'grey';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      case 'in_review':
        return 'En Revisión';
      default:
        return status;
    }
  };

  const handleBadgeClick = () => {
    if (userFinancing) {
      navigate(`/financing?id=${userFinancing.id}`);
    }
  };

  console.log(`✅ [FinancingVisualization] Renderizando badge para usuario ${userId} - Financiación: ${userFinancing.status}`);

  return (
    <div 
      className="transition-all duration-300 hover:scale-105 cursor-pointer" 
      onClick={handleBadgeClick} 
    >
      <Badge
        color={getBadgeColor(userFinancing.status)}
        className={`cursor-pointer border transition-colors duration-200 ${
          userFinancing.status === 'pending' 
            ? 'text-orange-600 border-orange-600 hover:bg-orange-50' 
            : userFinancing.status === 'approved'
            ? 'text-green-600 border-green-600 hover:bg-green-50'
            : userFinancing.status === 'rejected'
            ? 'text-red-600 border-red-600 hover:bg-red-50'
            : 'text-blue-600 border-blue-600 hover:bg-blue-50'
        }`}
        title={`Financiación solicitada el ${new Date(userFinancing.requested_at).toLocaleDateString('es-ES')}${userFinancing.contacted ? ' - Contactado' : ''}`}
      >
        💳 Financiación: {getStatusText(userFinancing.status)}
        {userFinancing.contacted && ' ✓'}
      </Badge>
    </div>
  );
};

export default FinancingVisualization;