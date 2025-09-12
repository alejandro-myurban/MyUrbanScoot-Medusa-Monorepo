import { useState } from "react";
import { Container, Heading, Button, Badge, Text } from "@medusajs/ui";
import { ArrowLeft, ChevronDown, ChevronUp, Edit, Eye } from "lucide-react";
import Whatsapp from "../../../../components/whatsapp";
import { FinancingDetailViewProps } from "../../types";
import { formatters } from "../../utils/formatters";
import { useFinancingData } from "../../hooks/useFinancingData";
import {
  getCivilStatusOptions,
  getHousingTypeOptions,
  getContractTypeOptions,
  getInstallmentOptions,
} from "../../constants";
import DocumentsSection from "./DocumentsSection";
import { extractionHelpers } from "../../utils/extractionHelpers";
import EditableField from "../../../../components/editable-field";
import DisplayField from "../../../../components/display-field";

const FinancingDetailView = ({ request, onBack }: FinancingDetailViewProps) => {
  const [selectedRequest, setSelectedRequest] = useState(request);
  const [showExtractedData, setShowExtractedData] = useState(false);
  const [manualDniMode, setManualDniMode] = useState(false);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Get functions from useFinancingData hook
  const { updateField: updateFieldInDB, updateAdminNotes } = useFinancingData();

  // Download functions for DocumentsSection
  const handleDownloadAll = async () => {
    // Implementar descarga masiva aquí o usar documentHelpers
    console.log("Descarga masiva solicitada");
  };

  const handleDownloadSingle = (url: string, filename: string) => {
    window.open(url, "_blank");
  };

  const extractDniInfo = (item: any) => {
    return extractionHelpers.extractDniInfo(item);
  };

  const extractPayrollInfo = (item: any) => {
    if (!item.payroll_verification?.primary?.extractedData) return {};
    const data = item.payroll_verification.primary.extractedData;
    return {
      employerName: data.employerName,
      employerAddress: data.employerAddress,
      jobTitle: data.jobTitle,
      grossSalary: data.grossSalary,
      netSalary: data.netSalary,
      ...data // Include any other fields
    };
  };

  const getSequentialId = (item: any) => {
    return item.sequentialId || "0001";
  };

  const formatDate = (dateString: string) => {
    return formatters.date(dateString);
  };

  const updateField = async (field: string, value: any) => {
    // Update local state immediately for optimistic UI
    setSelectedRequest((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Also update in database
    try {
      await updateFieldInDB({ id: request.id, field, value });
    } catch (error) {
      console.error("Error updating field in database:", error);
      // Revert local state if database update fails
      setSelectedRequest((prev) => ({
        ...prev,
        [field]: request[field as keyof typeof request],
      }));
      throw error;
    }
  };

  const initializeManualDniData = () => {
    // Si no hay datos del front, inicializarlos
    if (!selectedRequest.dni_front_verification?.extractedData) {
      const updatedRequest = {
        ...selectedRequest,
        dni_front_verification: {
          extractedData: {
            fullName: "",
            documentNumber: "",
            birthDate: "",
            sex: "",
            nationality: "",
          },
          issues: ["Entrada manual"],
        },
      };
      setSelectedRequest(updatedRequest);
    }
    // Si no hay datos del back, inicializarlos también
    if (!selectedRequest.dni_back_verification?.extractedData) {
      setSelectedRequest((prev) => ({
        ...prev,
        dni_back_verification: {
          extractedData: {
            addresses: [""],
            birthPlace: "",
          },
          issues: ["Entrada manual"],
        },
      }));
    }
    setManualDniMode(true);
  };

  const initializeManualDniBackData = () => {
    const updatedRequest = {
      ...selectedRequest,
      dni_back_verification: {
        extractedData: {
          addresses: [""],
          birthPlace: "",
        },
        issues: ["Entrada manual"],
      },
    };
    setSelectedRequest(updatedRequest);
  };

  const saveAdminNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateAdminNotes({ id: request.id, notes: adminNotes });
    } catch (error) {
      console.error("Error saving admin notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="small" onClick={onBack}>
            ← Volver
          </Button>
          <Heading level="h2">Detalle de Solicitud</Heading>
        </div>
        <Badge size="small">ID: #{getSequentialId(selectedRequest)}</Badge>
      </div>
      <div className="px-6 py-8 space-y-8">
        {/* Financiación - Primera sección */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Financiación
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <EditableField
                label="Plazos Solicitados"
                value={selectedRequest.financing_installment_count}
                type="select-input"
                options={getInstallmentOptions()}
                required={true}
                minValue={12}
                maxValue={60}
                onSave={(value) =>
                  updateField("financing_installment_count", value)
                }
              />
            </div>
            <div className="space-y-2">
              <DisplayField
                label="Fecha de Solicitud"
                value={formatDate(selectedRequest.requested_at)}
                showCopy={true}
              />
            </div>
          </div>
        </div>

        {/* Información DNI y Personal - Segunda sección */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Datos de Identificación
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {(() => {
                const dniInfo = extractDniInfo(selectedRequest);
                return (
                  <>
                    {dniInfo.documentNumber && (
                      <DisplayField
                        label="Número DNI"
                        value={dniInfo.documentNumber}
                        showCopy={true}
                      />
                    )}
                    {dniInfo.fullName && (
                      <DisplayField
                        label="Nombre Completo (DNI)"
                        value={dniInfo.fullName}
                        showCopy={true}
                      />
                    )}
                  </>
                );
              })()}
            </div>
            <div className="space-y-4">
              {(() => {
                const dniInfo = extractDniInfo(selectedRequest);
                return (
                  <>
                    {dniInfo.sex && (
                      <DisplayField
                        label="Sexo"
                        value={dniInfo.sex}
                        showCopy={true}
                      />
                    )}
                    {dniInfo.nationality && (
                      <DisplayField
                        label="Nacionalidad"
                        value={extractionHelpers.formatNationality(dniInfo.nationality)}
                        showCopy={true}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Botones de edición DNI fuera del grid */}
          <div className="space-y-4">
            {!manualDniMode && (
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={initializeManualDniData}
                  className="flex items-center gap-2 bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
                >
                  <Edit className="w-4 h-4" />
                  {selectedRequest.dni_front_verification?.extractedData ||
                  selectedRequest.dni_back_verification?.extractedData
                    ? "✏️ Editar Datos DNI"
                    : "➕ Añadir Datos DNI"}
                </Button>
                <Text size="small" className="text-gray-500">
                  {selectedRequest.dni_front_verification?.extractedData ||
                  selectedRequest.dni_back_verification?.extractedData
                    ? "Puede editar o completar los datos extraídos del DNI manualmente."
                    : "No se detectaron datos extraídos del DNI. Puede añadirlos manualmente."}
                </Text>
              </div>
            )}

            {/* Botón para añadir solo datos DNI trasero cuando existe el frontal */}
            {selectedRequest.dni_front_verification?.extractedData &&
              !selectedRequest.dni_back_verification?.extractedData && (
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={initializeManualDniBackData}
                    className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                  >
                    <Edit className="w-4 h-4" />➕ Añadir Datos DNI Trasero
                    Manualmente
                  </Button>
                  <Text size="small" className="text-gray-500">
                    Solo se detectaron datos del DNI frontal. Puede añadir los
                    del trasero manualmente.
                  </Text>
                </div>
              )}

            {/* Botón para salir del modo manual */}
            {manualDniMode && (
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setManualDniMode(false)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Cerrar Editor
                </Button>
              </div>
            )}

            {/* Acordeón con datos extraídos - se muestra cuando está en modo manual */}
            {manualDniMode && (
                <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {/* DNI Frontal */}
                  {selectedRequest.dni_front_verification?.extractedData && (
                    <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Text className="font-medium text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        {selectedRequest.dni_front_verification.issues?.includes(
                          "Entrada manual"
                        ) ? (
                          <>
                            ✏️ Datos DNI Frontal (Manual)
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                              MANUAL
                            </span>
                          </>
                        ) : (
                          <>
                            📋 Datos Extraídos del DNI Frontal
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              EXTRAÍDO
                            </span>
                          </>
                        )}
                      </Text>
                      <EditableField
                        label="Nombre Completo (DNI)"
                        value={
                          selectedRequest.dni_front_verification.extractedData
                            .fullName
                        }
                        type="text"
                        required={false}
                        onSave={(value) => {
                          const updated = {
                            ...selectedRequest.dni_front_verification,
                            extractedData: {
                              ...selectedRequest.dni_front_verification
                                .extractedData,
                              fullName: value,
                            },
                          };
                          return updateField("dni_front_verification", updated);
                        }}
                      />
                      <EditableField
                        label="Número de Documento (DNI)"
                        value={
                          selectedRequest.dni_front_verification.extractedData
                            .documentNumber
                        }
                        type="text"
                        required={false}
                        onSave={(value) => {
                          const updated = {
                            ...selectedRequest.dni_front_verification,
                            extractedData: {
                              ...selectedRequest.dni_front_verification
                                .extractedData,
                              documentNumber: value,
                            },
                          };
                          return updateField("dni_front_verification", updated);
                        }}
                      />
                      <EditableField
                        label="Fecha de Nacimiento (DNI)"
                        value={
                          selectedRequest.dni_front_verification.extractedData
                            .birthDate
                        }
                        type="text"
                        required={false}
                        placeholder="DD MM YYYY"
                        onSave={(value) => {
                          const updated = {
                            ...selectedRequest.dni_front_verification,
                            extractedData: {
                              ...selectedRequest.dni_front_verification
                                .extractedData,
                              birthDate: value,
                            },
                          };
                          return updateField("dni_front_verification", updated);
                        }}
                      />
                      <EditableField
                        label="Sexo (DNI)"
                        value={
                          selectedRequest.dni_front_verification.extractedData
                            .sex
                        }
                        type="select"
                        options={[
                          { value: "M", label: "Masculino" },
                          { value: "F", label: "Femenino" },
                        ]}
                        required={false}
                        onSave={(value) => {
                          const updated = {
                            ...selectedRequest.dni_front_verification,
                            extractedData: {
                              ...selectedRequest.dni_front_verification
                                .extractedData,
                              sex: value,
                            },
                          };
                          return updateField("dni_front_verification", updated);
                        }}
                      />
                      <EditableField
                        label="Nacionalidad (DNI)"
                        value={
                          selectedRequest.dni_front_verification.extractedData
                            .nationality
                        }
                        type="text"
                        required={false}
                        placeholder="ESP"
                        onSave={(value) => {
                          const updated = {
                            ...selectedRequest.dni_front_verification,
                            extractedData: {
                              ...selectedRequest.dni_front_verification
                                .extractedData,
                              nationality: value,
                            },
                          };
                          return updateField("dni_front_verification", updated);
                        }}
                      />
                    </div>
                  )}

                  {/* DNI Trasero */}
                  {selectedRequest.dni_back_verification?.extractedData && (
                    <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Text className="font-medium text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                        {selectedRequest.dni_back_verification.issues?.includes(
                          "Entrada manual"
                        ) ? (
                          <>
                            ✏️ Datos DNI Trasero (Manual)
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                              MANUAL
                            </span>
                          </>
                        ) : (
                          <>
                            📋 Datos Extraídos del DNI Trasero
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              EXTRAÍDO
                            </span>
                          </>
                        )}
                      </Text>
                      <EditableField
                        label="Dirección (DNI Trasero)"
                        value={(() => {
                          const addressData =
                            selectedRequest.dni_back_verification.extractedData
                              .addresses;
                          if (
                            Array.isArray(addressData) &&
                            addressData.length > 0
                          ) {
                            return addressData[0] || "";
                          }
                          if (typeof addressData === "string") {
                            const streetOnly =
                              addressData.split(",")[0]?.trim() || addressData;
                            return streetOnly;
                          }
                          return "";
                        })()}
                        type="text"
                        required={false}
                        placeholder="Ej: C. JOSEP BONATERA 44"
                        onSave={(value) => {
                          const updated = {
                            ...selectedRequest.dni_back_verification,
                            extractedData: {
                              ...selectedRequest.dni_back_verification
                                .extractedData,
                              addresses: [value],
                            },
                          };
                          return updateField("dni_back_verification", updated);
                        }}
                      />
                      <EditableField
                        label="Lugar de Nacimiento (DNI Trasero)"
                        value={
                          selectedRequest.dni_back_verification.extractedData
                            .birthPlace || ""
                        }
                        type="text"
                        required={false}
                        placeholder="Ej: BARCELONA"
                        onSave={(value) => {
                          const updated = {
                            ...selectedRequest.dni_back_verification,
                            extractedData: {
                              ...selectedRequest.dni_back_verification
                                .extractedData,
                              birthPlace: value,
                            },
                          };
                          return updateField("dni_back_verification", updated);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Domicilio y Contacto - Segunda sección (después de Identificación) */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Domicilio y Contacto
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <EditableField
                  label="Dirección"
                  value={selectedRequest.address}
                  type="text"
                  required={true}
                  onSave={(value) => updateField("address", value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    label="Código Postal"
                    value={selectedRequest.postal_code}
                    type="text"
                    required={true}
                    onSave={(value) => updateField("postal_code", value)}
                  />
                  <EditableField
                    label="Población"
                    value={selectedRequest.city}
                    type="text"
                    required={true}
                    onSave={(value) => updateField("city", value)}
                  />
                </div>
                <EditableField
                  label="Provincia"
                  value={selectedRequest.province}
                  type="text"
                  required={true}
                  onSave={(value) => updateField("province", value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <EditableField
                  label="Email"
                  value={selectedRequest.email}
                  type="email"
                  required={true}
                  onSave={(value) => updateField("email", value)}
                />
                <div className="space-y-1">
                  <EditableField
                    label="Teléfono"
                    value={selectedRequest.phone_mumber}
                    type="text"
                    required={true}
                    onSave={(value) => updateField("phone_mumber", value)}
                  />
                  <a
                    className="bg-green-400 w-1/3 text-sm flex items-center justify-center rounded-lg p-2 hover:bg-green-200 transition-all duration-150 mt-2"
                    target="_blank"
                    href={`https://wa.me/${
                      selectedRequest.phone_mumber
                    }?text=Hola%20${
                      extractDniInfo(selectedRequest).fullName || ""
                    }`}
                  >
                    Contactar con WhatsApp
                    <Whatsapp className="ml-2 w-5 h-5 hover:scale-100" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datos de Nacimiento - Tercera sección */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Datos de Nacimiento
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {(() => {
                const dniInfo = extractDniInfo(selectedRequest);
                return (
                  <>
                    {dniInfo.birthDate && (
                      <DisplayField
                        label="Fecha de Nacimiento"
                        value={dniInfo.birthDate}
                        showCopy={true}
                      />
                    )}
                  </>
                );
              })()}
            </div>
            <div className="space-y-4">
              {(() => {
                const dniInfo = extractDniInfo(selectedRequest);
                return (
                  <>
                    {dniInfo.birthPlace && (
                      <DisplayField
                        label="Lugar de Nacimiento"
                        value={dniInfo.birthPlace}
                        showCopy={true}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Estado Civil y Residencia - Cuarta sección */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Estado Civil y Residencia
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <EditableField
                  label="Estado Civil"
                  value={selectedRequest.civil_status}
                  type="select"
                  options={getCivilStatusOptions()}
                  required={true}
                  onSave={(value) => updateField("civil_status", value)}
                />
                <EditableField
                  label="Detalles Estado Civil"
                  value={selectedRequest.marital_status_details}
                  type="text"
                  required={false}
                  placeholder="Detalles adicionales del estado civil"
                  onSave={(value) =>
                    updateField("marital_status_details", value)
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <EditableField
                  label="Tipo de Vivienda"
                  value={(() => {
                    const option = getHousingTypeOptions().find(
                      (opt) => opt.value === selectedRequest.housing_type
                    );
                    return option ? option.label : selectedRequest.housing_type;
                  })()}
                  type="select"
                  options={getHousingTypeOptions()}
                  required={true}
                  onSave={(value) => updateField("housing_type", value)}
                />
                <EditableField
                  label="Detalles Tipo de Vivienda"
                  value={selectedRequest.housing_type_details}
                  type="text"
                  required={false}
                  placeholder="Detalles adicionales del tipo de vivienda"
                  onSave={(value) => updateField("housing_type_details", value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Datos Profesionales - Quinta sección */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Datos Profesionales
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <EditableField
                  label="Tipo de Contrato"
                  value={(() => {
                    const option = getContractTypeOptions().find(
                      (opt) => opt.value === selectedRequest.contract_type
                    );
                    return option
                      ? option.label
                      : selectedRequest.contract_type;
                  })()}
                  type="select"
                  options={getContractTypeOptions()}
                  required={true}
                  onSave={(value) => updateField("contract_type", value)}
                />
                {(() => {
                  console.log('selectedRequest.payroll_verification:', selectedRequest.payroll_verification);
                  const payrollInfo = extractPayrollInfo(selectedRequest);
                  console.log({payrollInfo})
                  return (
                    <>
                      {payrollInfo.employerName &&
                        (selectedRequest.contract_type === "employee_permanent" || 
                         selectedRequest.contract_type === "employee_temporary" ||
                         selectedRequest.contract_type === "employee") && (
                          <DisplayField
                            label="Empresa (Nómina)"
                            value={payrollInfo.employerName}
                            showCopy={true}
                          />
                        )}
                      {payrollInfo.employerAddress &&
                        (selectedRequest.contract_type === "employee_permanent" || 
                         selectedRequest.contract_type === "employee_temporary" ||
                         selectedRequest.contract_type === "employee") && (
                          <DisplayField
                            label="Dirección de la Empresa (Nómina)"
                            value={payrollInfo.employerAddress}
                            showCopy={true}
                          />
                        )}
                      {payrollInfo.jobTitle &&
                        (selectedRequest.contract_type === "employee_permanent" || 
                         selectedRequest.contract_type === "employee_temporary" ||
                         selectedRequest.contract_type === "employee") && (
                          <DisplayField
                            label="Puesto (Nómina)"
                            value={payrollInfo.jobTitle}
                            showCopy={true}
                          />
                        )}
                      {payrollInfo.grossSalary && (
                        <DisplayField
                          label="Salario Bruto (Nómina)"
                          value={
                            typeof payrollInfo.grossSalary === "string"
                              ? payrollInfo.grossSalary.replace(
                                  /【[^】]*】/g,
                                  ""
                                )
                              : payrollInfo.grossSalary
                          }
                          showCopy={true}
                        />
                      )}
                      {payrollInfo.netSalary && (
                        <DisplayField
                          label="Salario Neto (Nómina)"
                          value={
                            typeof payrollInfo.netSalary === "string"
                              ? payrollInfo.netSalary.replace(/【[^】]*】/g, "")
                              : payrollInfo.netSalary
                          }
                          showCopy={true}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <EditableField
                  label="Ingresos Mensuales (Declarados)"
                  value={selectedRequest.income}
                  type="text"
                  required={true}
                  placeholder="Ingrese el ingreso mensual en euros"
                  onSave={(value) => updateField("income", value)}
                />
                <EditableField
                  label="Cargo"
                  value={selectedRequest.company_position}
                  type="text"
                  required={false}
                  placeholder="Cargo o puesto de trabajo"
                  onSave={(value) => updateField("company_position", value)}
                />
                <EditableField
                  label="Fecha de inicio"
                  value={selectedRequest.company_start_date}
                  type="date"
                  required={false}
                  onSave={(value) => updateField("company_start_date", value)}
                />
                {selectedRequest.contract_type === "freelance" && (
                  <EditableField
                    label="Fecha de alta autónomo"
                    value={selectedRequest.freelance_start_date}
                    type="date"
                    required={false}
                    onSave={(value) =>
                      updateField("freelance_start_date", value)
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Documentación
          </Heading>
          <DocumentsSection
            request={selectedRequest}
            onDownloadAll={handleDownloadAll}
            onDownloadSingle={handleDownloadSingle}
          />
        </div>

        {/* Comentarios */}
        <div className="space-y-4">
          <Heading level="h3" className="text-lg">
            Comentarios del Cliente
          </Heading>
          <EditableField
            label="Comentarios/Dudas del Cliente"
            value={selectedRequest.doubts}
            type="textarea"
            required={false}
            placeholder="Comentarios o dudas del cliente"
            onSave={(value) => updateField("doubts", value)}
          />
        </div>

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
};

export default FinancingDetailView;
