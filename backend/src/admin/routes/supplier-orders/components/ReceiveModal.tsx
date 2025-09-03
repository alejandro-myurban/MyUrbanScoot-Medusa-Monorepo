import React, { useState } from "react";
import { Container, Heading, Button, Text, Badge } from "@medusajs/ui";
import { 
  Package, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle 
} from "lucide-react";
import { SupplierOrderLine } from "../types";

interface ReceiveModalProps {
  type: 'partial' | 'complete' | 'incident';
  line: SupplierOrderLine | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  getCurrentUserName: () => string;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  type,
  line,
  onClose,
  onSubmit,
  isLoading = false,
  getCurrentUserName,
}) => {
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState("");

  // Initialize quantity for partial reception
  React.useEffect(() => {
    if (type === 'partial' && line) {
      const pendingQty = line.quantity_pending || (line.quantity_ordered - line.quantity_received);
      setQuantity(pendingQty);
    }
  }, [type, line]);

  if (!line) return null;

  const handleSubmit = () => {
    if (type === 'partial') {
      onSubmit({
        lineId: line.id,
        data: {
          quantity_received: quantity,
          reception_notes: notes,
          received_by: getCurrentUserName(),
        }
      });
    } else if (type === 'complete') {
      const pendingQty = line.quantity_pending || (line.quantity_ordered - line.quantity_received);
      onSubmit({
        lineId: line.id,
        data: {
          quantity_received: pendingQty,
          reception_notes: notes || "Recepción completa",
          received_by: getCurrentUserName(),
        }
      });
    } else if (type === 'incident') {
      const isCurrentlyIncident = line.line_status === "incident";
      onSubmit({
        lineId: line.id,
        hasIncident: !isCurrentlyIncident,
        notes: !isCurrentlyIncident ? notes : "",
        userId: getCurrentUserName()
      });
    }
  };

  const isCurrentlyIncident = line.line_status === "incident";
  const pendingQty = line.quantity_pending || (line.quantity_ordered - line.quantity_received);
  const maxQty = pendingQty;

  // Validation
  const isValid = () => {
    if (type === 'partial') {
      return quantity > 0 && quantity <= maxQty;
    }
    if (type === 'incident' && !isCurrentlyIncident) {
      return notes.trim().length > 0;
    }
    return true;
  };

  const getTitle = () => {
    switch (type) {
      case 'partial': return "📦 Recepción Parcial";
      case 'complete': return "Recepción Completa";
      case 'incident': return isCurrentlyIncident ? "Quitar Incidencia" : "Marcar Incidencia";
      default: return "";
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'partial': return "text-blue-600";
      case 'complete': return "text-green-600";
      case 'incident': return isCurrentlyIncident ? "text-blue-600" : "text-red-600";
      default: return "";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'partial': return "bg-blue-50 border-blue-200";
      case 'complete': return "bg-green-50 border-green-200";
      case 'incident': return isCurrentlyIncident ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200";
      default: return "";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'partial': return "bg-blue-600 hover:bg-blue-700";
      case 'complete': return "bg-green-600 hover:bg-green-700";
      case 'incident': return isCurrentlyIncident ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700";
      default: return "";
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'partial': return <Package className="w-6 h-6" />;
      case 'complete': return <CheckCircle className="w-6 h-6" />;
      case 'incident': return <AlertCircle className="w-6 h-6" />;
      default: return null;
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="small" onClick={onClose}>
            ← Volver
          </Button>
          <Heading level="h2" className={getHeaderColor()}>{getTitle()}</Heading>
        </div>
      </div>

      <div className="px-6 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Product Info Section */}
          <div className={`${getBgColor()} border p-4 rounded-lg`}>
            <div className="flex items-start gap-3">
              <div className={getHeaderColor()}>{getIcon()}</div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${getHeaderColor().replace('text-', 'text-')}`}>
                  {type === 'partial' && "Recepción Parcial de Mercancía"}
                  {type === 'complete' && "Recepción Completa de Mercancía"}
                  {type === 'incident' && (isCurrentlyIncident ? "Resolver Incidencia" : "Reportar Incidencia")}
                </h3>
                
                {type === 'complete' && (
                  <Text className="text-green-700 mb-4">
                    Vas a recepcionar <strong>TODAS las unidades pendientes</strong> de este producto. 
                    Esta acción marcará la línea como completamente recibida.
                  </Text>
                )}

                {type === 'incident' && (
                  <Text className={isCurrentlyIncident ? 'text-blue-700' : 'text-red-700'}>
                    {isCurrentlyIncident 
                      ? "Esta línea está marcada como incidencia. ¿Deseas quitarle el estado de incidencia?"
                      : "Vas a marcar esta línea como incidencia. Describe el problema encontrado."
                    }
                  </Text>
                )}

                <div className={`bg-white border p-4 rounded-lg mt-4 ${
                  type === 'complete' ? 'border-green-200' : 
                  type === 'incident' ? (isCurrentlyIncident ? 'border-blue-200' : 'border-red-200') : 
                  'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <img className="w-20 h-20 rounded-xl" src={line.product_thumbnail} alt={line.product_title} />
                    <div className="flex-1">
                      <Text className="font-medium">{line.product_title}</Text>
                      {line.supplier_sku && (
                        <Text size="small" className="text-gray-600">Ref: {line.supplier_sku}</Text>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Text size="small" className="text-gray-600">Pedido</Text>
                      <Text className="font-medium">{line.quantity_ordered}</Text>
                    </div>
                    <div>
                      <Text size="small" className="text-gray-600">Recibido</Text>
                      <Text className="font-medium">{line.quantity_received}</Text>
                    </div>
                    <div>
                      <Text size="small" className="text-gray-600">
                        {type === 'complete' ? 'A Recepcionar' : 'Pendiente'}
                      </Text>
                      <Text className={`font-medium ${
                        type === 'complete' ? 'text-green-600 text-lg font-bold' : 'text-orange-600'
                      }`}>
                        {pendingQty}
                      </Text>
                    </div>
                  </div>

                  {/* Show current incident notes if exists */}
                  {type === 'incident' && isCurrentlyIncident && line.reception_notes && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <Text size="small" className="text-red-600 font-medium">Notas de la incidencia actual:</Text>
                      <Text size="small" className="text-red-700 mt-1">"{line.reception_notes}"</Text>
                    </div>
                  )}

                  {/* Show current status */}
                  {type === 'incident' && (
                    <div className="mt-4">
                      <Text size="small" className="text-gray-600">Estado actual</Text>
                      <Badge className={`${isCurrentlyIncident ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`} size="small">
                        {isCurrentlyIncident ? "Con Incidencia" : line.line_status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Input for Partial Reception */}
          {type === 'partial' && (
            <div>
              <label className="block text-sm font-medium mb-2">Cantidad a recepcionar *</label>
              <input
                type="number"
                min="1"
                max={maxQty}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <Text size="small" className="text-gray-500 mt-1">
                Máximo: {maxQty} unidades
              </Text>
            </div>
          )}

          {/* Notes Input */}
          <div>
            {type === 'partial' && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-yellow-800 mb-2">
                      📝 Notas de recepción parcial
                    </label>
                    <Text size="small" className="text-yellow-700 mb-3">
                      Describe el estado de la mercancía, motivo de la recepción parcial, incidencias encontradas, etc.
                    </Text>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="Ejemplo: 'Recibidas 5 de 10 unidades. Resto pendiente por disponibilidad del proveedor. Estado: perfecto.'"
                    />
                  </div>
                </div>
              </div>
            )}

            {type === 'complete' && (
              <div>
                <label className="block text-sm font-medium mb-2">Notas de recepción (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ejemplo: 'Mercancía recibida en perfecto estado. Entrega completa sin incidencias.'"
                />
                <Text size="small" className="text-gray-500 mt-1">
                  Si no se especifican notas, se guardará como "Recepción completa"
                </Text>
              </div>
            )}

            {type === 'incident' && !isCurrentlyIncident && (
              <div>
                <label className="block text-sm font-medium mb-2">Notas de la incidencia *</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Describe el problema: mercancía dañada, cantidad incorrecta, producto equivocado, etc."
                  required
                />
                <Text size="small" className="text-red-600 mt-1">
                  Las notas son obligatorias para reportar una incidencia
                </Text>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isValid()}
              className={getButtonColor()}
            >
              {isLoading ? (
                <>
                  {getIcon()}
                  <span className="ml-2">Procesando...</span>
                </>
              ) : (
                <>
                  {getIcon()}
                  <span className="ml-2">
                    {type === 'partial' && `Confirmar Recepción`}
                    {type === 'complete' && `Confirmar Recepción Completa (${pendingQty} unidades)`}
                    {type === 'incident' && (isCurrentlyIncident ? "Quitar Incidencia" : "Marcar como Incidencia")}
                  </span>
                </>
              )}
            </Button>
            
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            
            {/* Validation messages */}
            {type === 'partial' && (quantity <= 0 || quantity > maxQty) && (
              <Text size="small" className="text-red-600 ml-2">
                Cantidad debe ser entre 1 y {maxQty}
              </Text>
            )}
            
            {type === 'incident' && !isCurrentlyIncident && !notes.trim() && (
              <Text size="small" className="text-red-600 ml-2">
                Las notas son requeridas
              </Text>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ReceiveModal;