import { Button, Text } from "@medusajs/ui";
import { StatusControlSectionProps } from "../../types";
import { STATUS_OPTIONS } from "../../constants";
import StatusBadge from "../shared/StatusBadge";

const StatusControlSection = ({
  status,
  contacted,
  onStatusChange,
  onContactedToggle
}: StatusControlSectionProps) => {
  return (
    <div className="space-y-6">
      <Text className="text-lg font-semibold">Control de Estado</Text>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Control */}
        <div className="space-y-3">
          <Text className="text-base font-medium text-gray-700">Estado de la Solicitud</Text>
          
          <div className="flex items-center gap-3 mb-4">
            <Text size="small" className="text-gray-600">Estado actual:</Text>
            <StatusBadge status={status || 'pending'} />
          </div>

          <select
            value={status || 'pending'}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>

          <Text size="small" className="text-gray-500">
            El cambio de estado se guardará automáticamente
          </Text>
        </div>

        {/* Contacted Control */}
        <div className="space-y-3">
          <Text className="text-base font-medium text-gray-700">Estado de Contacto</Text>
          
          <div className="flex items-center gap-3 mb-4">
            <Text size="small" className="text-gray-600">Contactado:</Text>
            <div className={`px-2 py-1 rounded text-xs ${
              contacted 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {contacted ? '✅ Sí' : '❌ No'}
            </div>
          </div>

          <Button
            variant={contacted ? "secondary" : "primary"}
            size="small"
            onClick={onContactedToggle}
            className="w-full"
          >
            {contacted ? 'Marcar como NO contactado' : 'Marcar como contactado'}
          </Button>

          <Text size="small" className="text-gray-500">
            Indica si ya se ha contactado con el cliente
          </Text>
        </div>
      </div>

      {/* Status Guidelines */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <Text className="text-sm font-medium text-yellow-800 mb-2">
          Guía de Estados
        </Text>
        <div className="space-y-1 text-sm text-yellow-700">
          <div><strong>Pendiente:</strong> Solicitud recibida, sin revisar</div>
          <div><strong>Presupuestado:</strong> Se ha calculado el presupuesto</div>
          <div><strong>Falta documentación:</strong> Necesita documentos adicionales</div>
          <div><strong>En revisión:</strong> Documentación completa, en proceso</div>
          <div><strong>Preaceptada:</strong> Pre-aprobada, pendiente de confirmación final</div>
          <div><strong>En vigor:</strong> Financiación activa</div>
          <div><strong>Denegado:</strong> Solicitud rechazada</div>
          <div><strong>Cancelada:</strong> Cancelada por el cliente</div>
          <div><strong>Entregado:</strong> Proceso completado</div>
        </div>
      </div>
    </div>
  );
};

export default StatusControlSection;