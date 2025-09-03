import React from "react";
import { Container, Heading, Button, Text } from "@medusajs/ui";
import { Supplier } from "../types";

interface SupplierFormProps {
  formData: Partial<Supplier>;
  onFormDataChange: (data: Partial<Supplier>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
}) => {
  const handleInputChange = (field: keyof Supplier, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="small" onClick={onCancel}>
            ← Volver
          </Button>
          <Heading level="h2">{isEditing ? "Editar" : "Crear"} Proveedor</Heading>
        </div>
      </div>

      <div className="px-6 py-8">
        <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">Información General</Heading>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nombre Comercial *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Razón Social *</label>
                <input
                  type="text"
                  value={formData.legal_name || ""}
                  onChange={(e) => handleInputChange("legal_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">NIF/CIF *</label>
                <input
                  type="text"
                  value={formData.tax_id || ""}
                  onChange={(e) => handleInputChange("tax_id", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">Dirección</Heading>
              
              <div>
                <label className="block text-sm font-medium mb-2">Dirección *</label>
                <input
                  type="text"
                  value={formData.address_line_1 || ""}
                  onChange={(e) => handleInputChange("address_line_1", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dirección 2</label>
                <input
                  type="text"
                  value={formData.address_line_2 || ""}
                  onChange={(e) => handleInputChange("address_line_2", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CP *</label>
                  <input
                    type="text"
                    value={formData.postal_code || ""}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ciudad *</label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Provincia *</label>
                <input
                  type="text"
                  value={formData.province || ""}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">País</label>
                <select
                  value={formData.country_code || "ES"}
                  onChange={(e) => handleInputChange("country_code", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ES">España</option>
                  <option value="FR">Francia</option>
                  <option value="PT">Portugal</option>
                  <option value="IT">Italia</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Condiciones Comerciales</Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Condiciones de Pago (días)</label>
                <input
                  type="number"
                  value={formData.payment_terms || "30"}
                  onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Moneda</label>
                <select
                  value={formData.currency_code || "EUR"}
                  onChange={(e) => handleInputChange("currency_code", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descuento General (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage || 0}
                  onChange={(e) => handleInputChange("discount_percentage", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active ?? true}
                onChange={(e) => handleInputChange("is_active", e.target.checked)}
                className="w-4 h-4 text-green-500"
              />
              <Text>Proveedor activo</Text>
            </label>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default SupplierForm;