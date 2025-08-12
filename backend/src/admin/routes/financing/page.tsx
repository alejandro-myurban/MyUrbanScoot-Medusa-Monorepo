import { Container, Heading, Table, Badge, Text, Button } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";
import {
  Eye,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sdk } from "../../lib/sdk";
import Whatsapp from "../../components/whatsapp";

type FinancingData = {
  id: string;
  email: string;
  identity_front_file_id: string;
  identity_back_file_id: string;
  income: string;
  paysheet_file_id: string | null;
  contract_type: string;
  company_position: string | null;
  company_start_date: string | null;
  freelance_rental_file_id: string | null;
  freelance_quote_file_id: string | null;
  freelance_start_date: string | null;  // Nueva fecha de alta de autónomos
  pensioner_proof_file_id: string | null;
  bank_account_proof_file_id: string | null;
  financing_installment_count: string;
  housing_type: string;
  housing_type_details: string | null;
  civil_status: string;
  marital_status_details: string | null;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  phone_mumber: string;
  doubts: string | null;
  requested_at: string;
  created_at: string;
  dni_front_verification?: any;
  dni_back_verification?: any;
  payroll_verification?: any;
  bank_verification?: any;
  status: string;
  admin_notes?: string | null;
  contacted?: boolean;
};

const FinancingPage = () => {
  const [selectedRequest, setSelectedRequest] = useState<FinancingData | null>(
    null
  );
  const [filterByContractType, setFilterByContractType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterByStatus, setFilterByStatus] = useState<string>("");
  const [filterByContacted, setFilterByContacted] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 30;
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

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

  const downloadAllDocuments = async (request: FinancingData) => {
    const documents = [
      { url: request.identity_front_file_id, name: "DNI_anverso" },
      { url: request.identity_back_file_id, name: "DNI_reverso" },
      { url: request.freelance_rental_file_id, name: "declaracion_renta" },
      { url: request.freelance_quote_file_id, name: "cuota_autonomos" },
      { url: request.pensioner_proof_file_id, name: "justificante_pension" },
      {
        url: request.bank_account_proof_file_id,
        name: "justificante_bancario",
      },
    ].filter((doc) => doc.url); // Solo documentos que existen

    // Manejar nóminas múltiples (URLs separadas por |)
    if (request.paysheet_file_id) {
      const payrollUrls = request.paysheet_file_id.split("|");
      payrollUrls.forEach((url, index) => {
        if (url.trim()) {
          documents.push({
            url: url.trim(),
            name: payrollUrls.length > 1 ? `nomina_${index + 1}` : "nomina",
          });
        }
      });
    }

    if (documents.length === 0) {
      alert("No hay documentos disponibles para descargar");
      return;
    }

    // Crear un prefijo con email y fecha para identificar los archivos
    const emailPrefix = request.email.split("@")[0];
    const datePrefix = new Date(request.requested_at)
      .toISOString()
      .split("T")[0];
    const prefix = `${emailPrefix}_${datePrefix}`;

    // Descargar cada documento
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        const response = await fetch(doc.url);
        const blob = await response.blob();

        // Obtener la extensión del archivo de la URL o usar un default
        const urlParts = doc.url.split(".");
        const extension = urlParts[urlParts.length - 1].split("?")[0] || "jpg";

        // Crear el enlace de descarga
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${prefix}_${doc.name}.${extension}`;

        // Hacer clic automáticamente para descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Liberar memoria
        window.URL.revokeObjectURL(downloadUrl);

        // Pequeña pausa entre descargas para no saturar el navegador
        if (i < documents.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error descargando ${doc.name}:`, error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatIncome = (income: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(Number(income));
  };

  const getContractTypeLabel = (type: string) => {
    const labels = {
      employee: "Empleado",
      employee_permanent: "Fijo",
      employee_temporary: "Temporal",
      freelance: "Autónomo",
      pensioner: "Pensionista",
      unemployed: "Desempleado",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getContractTypeBadgeColor = (type: string) => {
    const colors = {
      employee_permanent: "text-black dark:text-white border-black",
      employee_temporary: "text-black dark:text-white border-black",
      employee: "text-black dark:text-white border-black",
      freelance: "text-black dark:text-white border-black",
      pensioner: "text-black dark:text-white border-black",
      unemployed: "text-black dark:text-white border-black",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getCivilStatusLabel = (status: string) => {
    const labels = {
      single: "Soltero/a",
      married: "Casado/a",
      divorced: "Divorciado/a",
      widowed: "Viudo/a",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getHousingTypeLabel = (type: string) => {
    const labels = {
      rent: "Alquiler",
      owned: "Propia (con hipoteca)",
      owned_free: "Propia (sin hipoteca)",
      family: "Familiar",
      other: "Otra",
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Función para extraer datos del DNI de las verificaciones
  const extractDniInfo = (request: FinancingData) => {
    let dniData = {
      fullName: null as string | null,
      documentNumber: null as string | null,
      birthDate: null as string | null,
      nationality: null as string | null,
      sex: null as string | null,
      addresses: null as string | null,
    };

    // Intentar obtener datos del DNI frontal primero
    if (request.dni_front_verification?.extractedData) {
      const frontData = request.dni_front_verification.extractedData;
      dniData.fullName = frontData.fullName || null;
      dniData.documentNumber = frontData.documentNumber || null;
      dniData.birthDate = frontData.birthDate || null;
      dniData.nationality = frontData.nationality || null;
      dniData.sex = frontData.sex || null;
    }

    if (request.dni_back_verification?.extractedData) {
      const backData = request.dni_back_verification.extractedData;
      dniData.addresses = backData.addresses || dniData.addresses;
    }

    // Si no hay datos del frontal, intentar con el trasero
    if (!dniData.fullName && request.dni_back_verification?.extractedData) {
      const backData = request.dni_back_verification.extractedData;
      dniData.fullName = backData.fullName || dniData.fullName;
      dniData.documentNumber =
        backData.documentNumber || dniData.documentNumber;
      dniData.birthDate = backData.birthDate || dniData.birthDate;
      dniData.nationality = backData.nationality || dniData.nationality;
      dniData.sex = backData.sex || dniData.sex;
    }

    return dniData;
  };

  // Función para extraer datos de la nómina de las verificaciones
  const extractPayrollInfo = (request: FinancingData) => {
    let payrollData = {
      employerName: null as string | null,
      employeeName: null as string | null,
      jobTitle: null as string | null,
      grossSalary: null as string | null,
      netSalary: null as string | null,
      payrollPeriod: null as string | null,
    };

    // Si hay verificación combinada de nóminas (nueva estructura)
    if (request.payroll_verification?.combined) {
      const primary = request.payroll_verification.primary?.extractedData;
      const secondary = request.payroll_verification.secondary?.extractedData;

      // Usar datos primarios primero, después secundarios como fallback
      payrollData.employerName =
        primary?.employerName || secondary?.employerName || null;
      payrollData.employeeName =
        primary?.employeeName || secondary?.employeeName || null;
      payrollData.jobTitle = primary?.jobTitle || secondary?.jobTitle || null;
      payrollData.grossSalary =
        primary?.grossSalary || secondary?.grossSalary || null;
      payrollData.netSalary =
        primary?.netSalary || secondary?.netSalary || null;
      payrollData.payrollPeriod =
        primary?.payrollPeriod || secondary?.payrollPeriod || null;
    }
    // Si hay verificación simple de nómina (estructura anterior)
    else if (request.payroll_verification?.extractedData) {
      const data = request.payroll_verification.extractedData;
      payrollData.employerName = data.employerName || null;
      payrollData.employeeName = data.employeeName || null;
      payrollData.jobTitle = data.jobTitle || null;
      payrollData.grossSalary = data.grossSalary || null;
      payrollData.netSalary = data.netSalary || null;
      payrollData.payrollPeriod = data.payrollPeriod || null;
    }

    return payrollData;
  };

  // Funciones para manejar estados
  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Sin gestionar",
      budgeted: "Presupuestado",
      missing_docs: "Falta documentación",
      denied: "Denegado",
      cancelled: "Cancelada",
      pre_accepted: "Preaceptada",
      under_review: "En revisión",
      in_force: "En vigor",
      in_software: "En software",
      delivered: "Entregado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-gray-50 text-yellow-800 border-yellow-200",
      budgeted: "bg-blue-100 text-blue-800 border-blue-200",
      missing_docs: "bg-orange-100 text-orange-800 border-orange-200",
      denied: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
      pre_accepted: "bg-purple-100 text-purple-800 border-purple-200",
      under_review: "bg-indigo-100 text-indigo-800 border-indigo-200",
      in_force: "bg-green-100 text-green-800 border-green-200",
      in_software: "bg-cyan-100 text-cyan-800 border-cyan-200",
      delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return (
      colors[status as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: "🕐",
      budgeted: "💰",
      missing_docs: "📋",
      denied: "❌",
      cancelled: "🚫",
      pre_accepted: "👀",
      under_review: "🔍",
      in_force: "✅",
      in_software: "💻",
      delivered: "🚀",
    };
    return icons[status as keyof typeof icons] || "📄";
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (!id || id.trim() === "") {
      console.error("❌ Error: ID vacío al intentar actualizar estado");
      return;
    }

    try {
      console.log(`🔄 Actualizando estado para ID: ${id} -> ${newStatus}`);
      const response = await sdk.client.fetch(
        `/store/financing-data/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key":
              "pk_14db1a49297371bf3f8d345db0cf016616d4244f1d593db1050907c88333cd21",
          },
          body: { status: newStatus },
        }
      );

      // Refrescar los datos sin recargar la página
      refetch();
      console.log(`✅ Estado actualizado exitosamente para ${id}`);
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert("Error al actualizar el estado: " + error.message);
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedRequest?.id) return;

    setIsSavingNotes(true);
    try {
      const response = await sdk.client.fetch(
        `/store/financing-data/${selectedRequest.id}/notes`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key":
              "pk_14db1a49297371bf3f8d345db0cf016616d4244f1d593db1050907c88333cd21",
          },
          body: { admin_notes: adminNotes },
        }
      );

      console.log("✅ Notas guardadas exitosamente");
      // Refrescar los datos para obtener las notas actualizadas
      refetch();
    } catch (error: any) {
      console.error("Error saving notes:", error);
      alert("Error al guardar las notas: " + error.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const updateContactedStatus = async (id: string, contacted: boolean) => {
    if (!id || id.trim() === "") {
      console.error(
        "❌ Error: ID vacío al intentar actualizar estado de contacto"
      );
      return;
    }

    try {
      console.log(
        `🔄 Actualizando estado de contacto para ID: ${id} -> ${contacted}`
      );
      const response = await sdk.client.fetch(
        `/store/financing-data/${id}/contacted`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key":
              "pk_14db1a49297371bf3f8d345db0cf016616d4244f1d593db1050907c88333cd21",
          },
          body: { contacted },
        }
      );

      console.log(`✅ Estado de contacto actualizado exitosamente para ${id}`);
      // Refrescar los datos sin recargar la página
      refetch();
    } catch (error: any) {
      console.error("Error updating contacted status:", error);
      alert("Error al actualizar el estado de contacto: " + error.message);
    }
  };

  // Cargar las notas cuando se selecciona una solicitud
  useEffect(() => {
    if (selectedRequest) {
      setAdminNotes(selectedRequest.admin_notes || "");
    }
  }, [selectedRequest]);

  const hasDocuments = (request: FinancingData) => {
    let count = 0;

    // Contar nóminas (puede ser múltiples con |)
    if (request.paysheet_file_id) {
      const payrollUrls = request.paysheet_file_id
        .split("|")
        .filter((url) => url.trim());
      count += payrollUrls.length;
    }

    // Contar otros documentos
    const otherDocs = [
      request.freelance_rental_file_id,
      request.freelance_quote_file_id,
      request.pensioner_proof_file_id,
      request.bank_account_proof_file_id,
    ];
    count += otherDocs.filter(Boolean).length;

    return count;
  };

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Solicitudes de Financiación</Heading>
        </div>
        <div className="px-6 py-8">
          <Text>Cargando datos...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Solicitudes de Financiación</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-red-500">Error al cargar los datos</Text>
        </div>
      </Container>
    );
  }

  const financing: FinancingData[] = financingData?.financing_data || [];

  // Filtrar por tipo de contrato, estado, contactado y término de búsqueda
  const filteredFinancing = financing.filter((item) => {
    // Filtro por tipo de contrato
    const matchesContract =
      !filterByContractType || item.contract_type === filterByContractType;

    // Filtro por estado
    const matchesStatus =
      !filterByStatus || (item.status || "pending") === filterByStatus;

    // Filtro por contactado
    const matchesContacted = 
      !filterByContacted || 
      (filterByContacted === "contacted" && item.contacted === true) ||
      (filterByContacted === "not_contacted" && item.contacted !== true);

    // Filtro por término de búsqueda (teléfono o nombre extraído del DNI)
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const phoneMatch = item.phone_mumber.toLowerCase().includes(searchLower);

      // Buscar en el nombre extraído del DNI
      const dniInfo = extractDniInfo(item);
      const nameMatch =
        dniInfo.fullName?.toLowerCase().includes(searchLower) || false;

      matchesSearch = phoneMatch || nameMatch;
    }

    return matchesContract && matchesStatus && matchesContacted && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredFinancing.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFinancing = filteredFinancing.slice(startIndex, endIndex);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterByContractType, searchTerm, filterByStatus, filterByContacted]);

  if (selectedRequest) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSelectedRequest(null)}
            >
              ← Volver
            </Button>
            <Heading level="h2">Detalle de Solicitud</Heading>
          </div>
          <Badge size="small">ID: {selectedRequest.id.slice(-8)}</Badge>
        </div>

        <div className="px-6 py-8 space-y-8">
          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Información Personal
              </Heading>
              <div className="space-y-2">
                {(() => {
                  const dniInfo = extractDniInfo(selectedRequest);
                  return (
                    <>
                      {dniInfo.fullName && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Nombre Completo (DNI)
                          </Text>
                          <Text className="font-medium">
                            {dniInfo.fullName}
                          </Text>
                        </div>
                      )}
                      {dniInfo.documentNumber && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Número DNI
                          </Text>
                          <Text className="font-medium">
                            {dniInfo.documentNumber}
                          </Text>
                        </div>
                      )}
                      {dniInfo.sex && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Sexo
                          </Text>
                          <Text className="font-medium">{dniInfo.sex}</Text>
                        </div>
                      )}
                      {dniInfo.birthDate && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Fecha de Nacimiento
                          </Text>
                          <Text className="font-medium">
                            {dniInfo.birthDate}
                          </Text>
                        </div>
                      )}
                      {dniInfo.nationality && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Nacionalidad
                          </Text>
                          <Text className="font-medium">
                            {dniInfo.nationality}
                          </Text>
                        </div>
                      )}
                      {dniInfo.sex && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Sexo
                          </Text>
                          <Text className="font-medium">{dniInfo.sex}</Text>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Email
                  </Text>
                  <Text className="font-medium">{selectedRequest.email}</Text>
                </div>
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Teléfono
                  </Text>
                  <Text className="font-medium flex gap-3 items-center  ">
                    {selectedRequest.phone_mumber}
                    <a
                      className="bg-green-400 w-10 flex items-center justify-center rounded-lg p-2  hover:bg-green-200 transition-all duration-150"
                      target="_blank"
                      href={`https://wa.me/34${
                        selectedRequest.phone_mumber
                      }?text=Hola%20${
                        extractDniInfo(selectedRequest).fullName || ""
                      }`}
                    >
                      <Whatsapp className="w-5 h-5 hover:scale-100" />
                    </a>
                  </Text>
                </div>
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Estado Civil
                  </Text>
                  <Text className="font-medium">
                    {getCivilStatusLabel(selectedRequest.civil_status)}
                  </Text>
                  {selectedRequest.marital_status_details && (
                    <Text size="small" className="text-gray-500">
                      {selectedRequest.marital_status_details}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Domicilio
              </Heading>
              <div className="space-y-2">
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Dirección
                  </Text>
                  {(() => {
                    const dniInfo = extractDniInfo(selectedRequest);
                    return dniInfo.addresses ? (
                      <span>{dniInfo.addresses}</span>
                    ) : (
                      <span>{selectedRequest.address}</span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text
                      size="small"
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Código Postal
                    </Text>
                    <Text className="font-medium">
                      {selectedRequest.postal_code}
                    </Text>
                  </div>
                  <div>
                    <Text
                      size="small"
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Ciudad
                    </Text>
                    <Text className="font-medium">{selectedRequest.city}</Text>
                  </div>
                </div>
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Provincia
                  </Text>
                  <Text className="font-medium">
                    {selectedRequest.province}
                  </Text>
                </div>
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Tipo de Vivienda
                  </Text>
                  <Text className="font-medium">
                    {getHousingTypeLabel(selectedRequest.housing_type)}
                  </Text>
                  {selectedRequest.housing_type_details && (
                    <Text size="small" className="text-gray-500">
                      {selectedRequest.housing_type_details}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información Laboral y Financiera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Información Laboral
              </Heading>
              <div className="space-y-2">
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Tipo de Contrato
                  </Text>
                  <Badge
                    className={getContractTypeBadgeColor(
                      selectedRequest.contract_type
                    )}
                  >
                    {getContractTypeLabel(selectedRequest.contract_type)}
                  </Badge>
                </div>
                {(() => {
                  const payrollInfo = extractPayrollInfo(selectedRequest);
                  return (
                    <>
                      {payrollInfo.employerName &&
                        selectedRequest.contract_type === "employee" && (
                          <div>
                            <Text
                              size="small"
                              className="text-gray-600 dark:text-gray-400"
                            >
                              Empresa (Nómina)
                            </Text>
                            <Text className="font-medium">
                              {payrollInfo.employerName}
                            </Text>
                          </div>
                        )}
                      {payrollInfo.jobTitle &&
                        selectedRequest.contract_type === "employee" && (
                          <div>
                            <Text
                              size="small"
                              className="text-gray-600 dark:text-gray-400"
                            >
                              Puesto (Nómina)
                            </Text>
                            <Text className="font-medium">
                              {payrollInfo.jobTitle}
                            </Text>
                          </div>
                        )}
                      {payrollInfo.grossSalary && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Salario Bruto (Nómina)
                          </Text>
                          <Text className="font-semibold text-base text-blue-600">
                            {payrollInfo.grossSalary}
                          </Text>
                        </div>
                      )}
                      {payrollInfo.netSalary && (
                        <div>
                          <Text
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Salario Neto (Nómina)
                          </Text>
                          <Text className="font-semibold text-base text-green-600">
                            {payrollInfo.netSalary}
                          </Text>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Ingresos Mensuales (Declarados)
                  </Text>
                  <Text className="font-semibold text-green-600 text-base">
                    {formatIncome(selectedRequest.income)}
                  </Text>
                </div>
                {selectedRequest.company_position && (
                  <div>
                    <Text
                      size="small"
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Cargo
                    </Text>
                    <Text className="font-medium">
                      {selectedRequest.company_position}
                    </Text>
                  </div>
                )}
                {selectedRequest.company_start_date && (
                  <div>
                    <Text
                      size="small"
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Fecha de inicio
                    </Text>
                    <Text className="font-medium">
                      {formatDate(selectedRequest.company_start_date)}
                    </Text>
                  </div>
                )}
                {selectedRequest.contract_type === "freelance" && selectedRequest.freelance_start_date && (
                  <div>
                    <Text
                      size="small"
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Fecha de alta autónomo
                    </Text>
                    <Text className="font-medium">
                      {formatDate(selectedRequest.freelance_start_date)}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Financiación
              </Heading>
              <div className="space-y-2">
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Plazos Solicitados
                  </Text>
                  <Badge size="large">
                    {selectedRequest.financing_installment_count} meses
                  </Badge>
                </div>
                <div>
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Fecha de Solicitud
                  </Text>
                  <Text className="font-medium">
                    {formatDate(selectedRequest.requested_at)}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">
              Documentación
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 flex flex-col">
                <Text size="small" className="text-gray-600 dark:text-gray-400">
                  DNI/NIE
                </Text>
                {selectedRequest.identity_front_file_id ? (
                  <a
                    href={selectedRequest.identity_front_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2  text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Anverso
                  </a>
                ) : (
                  <Text size="small" className="text-gray-400">
                    No disponible
                  </Text>
                )}
                {selectedRequest.identity_back_file_id ? (
                  <a
                    href={selectedRequest.identity_back_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2  text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Reverso
                  </a>
                ) : (
                  <Text size="small" className="text-gray-400">
                    No disponible
                  </Text>
                )}
              </div>

              {selectedRequest.paysheet_file_id &&
                (() => {
                  const payrollUrls = selectedRequest.paysheet_file_id
                    .split("|")
                    .filter((url) => url.trim());
                  return payrollUrls.map((url, index) => (
                    <div key={index} className="space-y-2">
                      <Text
                        size="small"
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {payrollUrls.length > 1
                          ? `Nómina ${index + 1}`
                          : "Nómina"}
                      </Text>
                      <a
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-gray-300 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                        Ver nómina {payrollUrls.length > 1 ? index + 1 : ""}
                      </a>
                    </div>
                  ));
                })()}

              {selectedRequest.freelance_rental_file_id && (
                <div className="space-y-2">
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Declaración de la Renta
                  </Text>
                  <a
                    href={selectedRequest.freelance_rental_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver declaración
                  </a>
                </div>
              )}

              {selectedRequest.freelance_quote_file_id && (
                <div className="space-y-2">
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Cuota de Autónomos
                  </Text>
                  <a
                    href={selectedRequest.freelance_quote_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver cuota
                  </a>
                </div>
              )}

              {selectedRequest.pensioner_proof_file_id && (
                <div className="space-y-2">
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Justificante de Pensión
                  </Text>
                  <a
                    href={selectedRequest.pensioner_proof_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2  text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver justificante
                  </a>
                </div>
              )}

              {selectedRequest.bank_account_proof_file_id && (
                <div className="space-y-2">
                  <Text
                    size="small"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Justificante Bancario
                  </Text>
                  <a
                    href={selectedRequest.bank_account_proof_file_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2  text-blue-600 dark:text-gray-300 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Ver justificante
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Comentarios */}
          {selectedRequest.doubts && (
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">
                Comentarios del Cliente
              </Heading>
              <div className="bg-gray-50 dark:bg-gray-300 dark:text-black p-4 rounded-lg">
                <Text>{selectedRequest.doubts}</Text>
              </div>
            </div>
          )}

          {/* Notas del Admin */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">
              Notas
            </Heading>
            <div className="space-y-3">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Agregar notas administrativas sobre esta solicitud..."
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg text-black resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-300 dark:border-gray-600"
                rows={4}
              />
              <div className="flex justify-end">
                <Button
                  onClick={saveAdminNotes}
                  disabled={isSavingNotes}
                  size="small"
                >
                  {isSavingNotes ? "Guardando..." : "Guardar Notas"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Solicitudes de Financiación</Heading>
        <div className="flex items-center gap-2">
          <Badge size="small">
            {filteredFinancing.length}{" "}
            {filteredFinancing.length === financing.length
              ? "solicitudes"
              : `de ${financing.length} solicitudes`}
          </Badge>
          <Button variant="secondary" size="small">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 ">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterByContractType}
            onChange={(e) => setFilterByContractType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los tipos de contrato</option>
            <option value="employee_permanent">Empleados Fijos</option>
            <option value="employee_temporary">Empleados Temporales</option>
            <option value="freelance">Autónomos</option>
            <option value="pensioner">Pensionistas</option>
            <option value="unemployed">Desempleados</option>
          </select>
          <select
            value={filterByStatus}
            onChange={(e) => setFilterByStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="pending">
              {getStatusIcon("pending")} Pendientes
            </option>
            <option value="budgeted">
              {getStatusIcon("budgeted")} Presupuestados
            </option>
            <option value="missing_docs">
              {getStatusIcon("missing_docs")} Falta documentación
            </option>
            <option value="denied">{getStatusIcon("denied")} Denegados</option>
            <option value="cancelled">
              {getStatusIcon("cancelled")} Canceladas
            </option>
            <option value="pre_accepted">
              {getStatusIcon("pre_accepted")} Preaceptadas
            </option>
            <option value="under_review">
              {getStatusIcon("under_review")} En revisión
            </option>
            <option value="in_force">
              {getStatusIcon("in_force")} En vigor
            </option>
            <option value="in_software">
              {getStatusIcon("in_software")} En software
            </option>
            <option value="delivered">
              {getStatusIcon("delivered")} Entregados
            </option>
          </select>
          <select
            value={filterByContacted}
            onChange={(e) => setFilterByContacted(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos (contactado)</option>
            <option value="contacted">✅ Contactados</option>
            <option value="not_contacted">❌ No contactados</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por teléfono"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm min-w-[200px]"
            />
          </div>
          {(filterByContractType || searchTerm || filterByStatus || filterByContacted) && (
            <button
              onClick={() => {
                setFilterByContractType("");
                setSearchTerm("");
                setFilterByStatus("");
                setFilterByContacted("");
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-8 overflow-scroll">
        {paginatedFinancing.length === 0 && filteredFinancing.length === 0 ? (
          <Text className="text-gray-500">
            {filterByContractType || searchTerm || filterByStatus || filterByContacted
              ? `No se encontraron solicitudes que coincidan con los filtros aplicados`
              : `No hay solicitudes de financiación todavía`}
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Contactado</Table.HeaderCell>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Contacto</Table.HeaderCell>
                <Table.HeaderCell>Trabajo</Table.HeaderCell>
                <Table.HeaderCell>Ingresos</Table.HeaderCell>
                <Table.HeaderCell>Financiación</Table.HeaderCell>
                <Table.HeaderCell>Documentos</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
                <Table.HeaderCell>Fecha</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedFinancing.map((item, index) => {
                // Debug logging para items sin ID
                if (!item.id || item.id.trim() === "") {
                  console.warn(`⚠️ Item sin ID en posición ${index}:`, item);
                }

                return (
                  <Table.Row key={item.id || `no-id-${index}`}>
                    <Table.Cell>
                      <select
                        value={item.status || "pending"}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className={`px-2 py-1 text-xs rounded border ${getStatusColor(
                          item.status || "pending"
                        )} cursor-pointer`}
                        disabled={!item.id || item.id.trim() === ""}
                      >
                        <option value="pending">
                          {getStatusIcon("pending")} Sin gestionar
                        </option>
                        <option value="budgeted">
                          {getStatusIcon("budgeted")} Presupuestado
                        </option>
                        <option value="missing_docs">
                          {getStatusIcon("missing_docs")} Falta documentación
                        </option>
                        <option value="denied">
                          {getStatusIcon("denied")} Denegado
                        </option>
                        <option value="cancelled">
                          {getStatusIcon("cancelled")} Cancelada
                        </option>
                        <option value="pre_accepted">
                          {getStatusIcon("pre_accepted")} Preaceptada
                        </option>
                        <option value="under_review">
                          {getStatusIcon("under_review")} En revisión
                        </option>
                        <option value="in_force">
                          {getStatusIcon("in_force")} En vigor
                        </option>
                        <option value="in_software">
                          {getStatusIcon("in_software")} En software
                        </option>
                        <option value="delivered">
                          {getStatusIcon("delivered")} Entregado
                        </option>
                      </select>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.contacted || false}
                          onChange={(e) =>
                            updateContactedStatus(item.id, e.target.checked)
                          }
                          disabled={!item.id || item.id.trim() === ""}
                          className="w-4 h-4 text-green-500 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {item.contacted ? "Contactado" : "No contactado"}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1">
                        <Text className="font-medium">{item.email}</Text>
                        <Text size="small" className="text-gray-400">
                          {item.city}, {item.province}
                        </Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1">
                        <Text size="small">📧 {item.email}</Text>
                        <Text size="small">📞 {item.phone_mumber}</Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1 p-2">
                        <Badge
                          className={getContractTypeBadgeColor(
                            item.contract_type
                          )}
                          size="small"
                        >
                          {getContractTypeLabel(item.contract_type)}
                        </Badge>
                        {item.company_position && (
                          <Text size="small" className="text-gray-400">
                            {item.company_position}
                          </Text>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="font-semibold text-green-600">
                        {formatIncome(item.income)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="small">
                        {item.financing_installment_count} meses
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="small">{hasDocuments(item)} docs</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => setSelectedRequest(item)}
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => downloadAllDocuments(item)}
                          disabled={hasDocuments(item) === 0}
                          title={
                            hasDocuments(item) === 0
                              ? "No hay documentos disponibles"
                              : "Descargar todos los documentos"
                          }
                        >
                          <Download className="w-4 h-4" />
                          Docs
                        </Button>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-gray-400">
                        {formatDate(item.requested_at)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}

        {/* Controles de paginación */}
        {filteredFinancing.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Text size="small">
                Mostrando {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredFinancing.length)} de{" "}
                {filteredFinancing.length} solicitudes
              </Text>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + index;
                  } else {
                    pageNumber = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNumber
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Financiación",
});

export default FinancingPage;
