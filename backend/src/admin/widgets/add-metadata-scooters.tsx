// components/ScooterMetadataWidget.tsx
import React, { useEffect, useState } from 'react';
import { DetailWidgetProps, AdminProduct } from '@medusajs/framework/types';
import { sdk } from '../lib/sdk'; 
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Select } from "@medusajs/ui";

interface ScooterMetadata {
  dgt?: string; motor_type?: string; hydraulic_brakes?: string;
  tire_size?: string; tire_grip_type?: string; tire_type?: string;
  autonomy_km?: number; motor_power_w?: number; battery_voltage_v?: number;
  weight_kg?: number; max_speed_kmh?: number;
  [key: string]: any; 
}

const dgtOptions = ["DGT", "NO DGT"];
const motorTypeOptions = ["single", "dual"];
const hydraulicBrakesOptions = ["yes", "no"];
const tireSizeOptions = ["10\"x3", "10\"x2,75-6,5", "8,5\"x3"];
const gripTypeOptions = ["offroad (Taco)", "smooth", "mixed"];
const tireTypeOptions = ["Tubeless", "Tube", "Solid"];

const ScooterMetadataWidget: React.FC<DetailWidgetProps<AdminProduct>> = ({ data }) => {
  console.log("DEBUG: SDK object imported into widget:", sdk);
  console.log("DEBUG: sdk.admin.product available:", sdk.admin?.product);
  console.log("DEBUG: data prop recibida:", data);

  const productId = data.id;

  // Función para extraer metadatos iniciales
  const getInitialMetadata = (): ScooterMetadata => {
    const metadata = data.metadata || {}; 
    const initial: ScooterMetadata = {
      dgt: metadata.dgt as string || '',
      motor_type: metadata.motor_type as string || '',
      hydraulic_brakes: metadata.hydraulic_brakes as string || '',
      tire_size: metadata.tire_size as string || '',
      tire_grip_type: metadata.tire_grip_type as string || '',
      tire_type: metadata.tire_type as string || '',
      // Para números, si el valor no existe o es inválido, usar undefined para que el input muestre vacío
      autonomy_km: typeof metadata.autonomy_km === 'number' ? metadata.autonomy_km : undefined,
      motor_power_w: typeof metadata.motor_power_w === 'number' ? metadata.motor_power_w : undefined,
      battery_voltage_v: typeof metadata.battery_voltage_v === 'number' ? metadata.battery_voltage_v : undefined,
      weight_kg: typeof metadata.weight_kg === 'number' ? metadata.weight_kg : undefined,
      max_speed_kmh: typeof metadata.max_speed_kmh === 'number' ? metadata.max_speed_kmh : undefined,
    };
    console.log("DEBUG: Metadatos iniciales extraídos (initialMetadata):", initial);
    return initial;
  };

  const [metadata, setMetadata] = useState<ScooterMetadata>(getInitialMetadata());
  const [saving, setSaving] = useState(false);

  // useEffect para re-inicializar el estado si cambia 
  useEffect(() => {
    setMetadata(getInitialMetadata());
  }, [data.metadata, productId]); 

  // Manejador de cambios para campos de texto/número y Select
  const handleChange = (name: string, value: string | number | undefined, type?: string) => {
    console.log(`DEBUG: Cambio detectado - Campo: ${name}, Valor: ${value}, Tipo: ${type}`);
    let newValue: string | number | undefined = value;
    if (type === 'number') {
      newValue = (value as string).trim() === '' ? undefined : (isNaN(Number(value)) ? 0 : Number(value));
    }
    setMetadata(prev => {
      const updatedMetadata = { ...prev, [name]: newValue };
      console.log('DEBUG: Estado de metadatos actualizado:', updatedMetadata);
      return updatedMetadata;
    });
  };

  // Función para guardar los metadatos
  const handleSave = async () => {
    setSaving(true);
    console.log("DEBUG: Iniciando guardado de metadatos.");
    try {
      const updatedProductMetadata: Record<string, any> = { ...data.metadata };

      for (const key in metadata) {
        const value = metadata[key as keyof ScooterMetadata];

        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          delete updatedProductMetadata[key];
        } else {
          updatedProductMetadata[key] = value;
        }
      }

      console.log("DEBUG: Metadatos a enviar (final payload):", updatedProductMetadata); 
      await sdk.admin.product.update(productId, { metadata: updatedProductMetadata });
      toast.success('Metadatos guardados!');
      console.log("DEBUG: Metadatos guardados exitosamente en la API.");
      // Recargar la página para que Medusa Admin refleje los cambios completamente
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      console.error('ERROR: Fallo al guardar metadatos:', err);
      toast.error(`Error al guardar: ${err.message || 'Desconocido'}`);
    } finally {
      setSaving(false);
      console.log("DEBUG: Guardado de metadatos finalizado.");
    }
  };

  return (
    <Container className="p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Metadatos de Scooter</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Select fields */}
        {[
          { key: 'dgt', label: 'Homologación DGT', options: dgtOptions },
          { key: 'motor_type', label: 'Tipo de Motor', options: motorTypeOptions },
          { key: 'hydraulic_brakes', label: 'Frenos Hidráulicos', options: hydraulicBrakesOptions },
          { key: 'tire_size', label: 'Tamaño Neumático', options: tireSizeOptions },
          { key: 'tire_grip_type', label: 'Tipo de Agarre Neumático', options: gripTypeOptions },
          { key: 'tire_type', label: 'Tipo de Neumático', options: tireTypeOptions },
        ].map(({ key, label, options }) => (
          <div key={key} className="flex flex-col">
            <label htmlFor={key} className="text-sm font-medium text-gray-100 mb-1">{label}</label>
            <Select
              name={key}
              value={String(metadata[key as keyof ScooterMetadata] || '')}
              onValueChange={(value) => handleChange(key, value, 'text')}
            >
              <Select.Trigger id={key}><Select.Value placeholder="Seleccionar" /></Select.Trigger>
              <Select.Content>
                {options.map(option => <Select.Item key={option} value={option}>{option}</Select.Item>)}
              </Select.Content>
            </Select>
          </div>
        ))}

        {/* Numeric Input fields */}
        {[
          { key: 'autonomy_km', label: 'Autonomía (km)' }, { key: 'motor_power_w', label: 'Potencia Motor (W)' },
          { key: 'battery_voltage_v', label: 'Voltaje Batería (V)' }, { key: 'weight_kg', label: 'Peso (kg)' },
          { key: 'max_speed_kmh', label: 'Velocidad Máxima (km/h)' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <label htmlFor={key} className="text-sm font-medium text-gray-300 w-48 flex-shrink-0">{label}</label>
            <Input
              type="number" id={key} name={key}
              value={metadata[key as keyof ScooterMetadata] !== undefined ? metadata[key as keyof ScooterMetadata] : ''}
              onChange={(e) => handleChange(key, e.target.value, 'number')}
              min={0} step={1}
              placeholder={`Ej: ${key.includes('km') ? '50' : key.includes('W') ? '1000' : '48'}`}
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar Metadatos'}
      </Button>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ScooterMetadataWidget;
