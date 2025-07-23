// components/ScooterMetadataWidget.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { DetailWidgetProps, AdminProduct, Product } from '@medusajs/framework/types';
import { sdk } from '../lib/sdk';
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Button,
  Input,
  toast,
  Select,
  Heading,
  Label,
} from "@medusajs/ui";

interface ScooterMetadata {
  dgt?: string;
  motor_type?: string;
  hydraulic_brakes?: string;
  tire_size?: string;
  tire_grip_type?: string;
  tire_type?: string;
  autonomy_km?: number;
  motor_power_w?: number;
  battery_voltage_v?: number;
  weight_kg?: number;
  max_speed_kmh?: number;
  warranty_months?: string;
  breakes_details?: string;
  [key: string]: any;
}

const dgtOptions = ["DGT", "NO DGT"];
const motorTypeOptions = ["single", "dual"];
const hydraulicBrakesOptions = ["yes", "no"];
const gripTypeOptions = ["offroad (Taco)", "smooth", "mixed"];
const tireTypeOptions = ["Tubeless", "Tube", "Solid"];

const labelMap: Record<string, string> = {
  tire_size: 'Tamaño Neumático',
  warranty_months: 'Garantía',
  breakes_details: 'Detalles de Frenado',
  dgt: 'Homologación DGT',
  motor_type: 'Tipo de Motor',
  hydraulic_brakes: 'Frenos Hidráulicos',
  tire_grip_type: 'Tipo de Agarre Neumático',
  tire_type: 'Tipo de Neumático',
  autonomy_km: 'Autonomía (km)',
  motor_power_w: 'Potencia Motor (W)',
  battery_voltage_v: 'Voltaje Batería (V)',
  weight_kg: 'Peso (kg)',
  max_speed_kmh: 'Velocidad Máxima (km/h)',
};

const ScooterMetadataWidget: React.FC<DetailWidgetProps<AdminProduct>> = ({ data }) => {
  const productId = data.id;

  const getInitialMetadata = (): ScooterMetadata => {
    const metadata = data.metadata || {};
    const initial: ScooterMetadata = {
      dgt: metadata.dgt as string || '',
      motor_type: metadata.motor_type as string || '',
      hydraulic_brakes: metadata.hydraulic_brakes as string || '',
      tire_size: metadata.tire_size as string || '',
      tire_grip_type: metadata.tire_grip_type as string || '',
      tire_type: metadata.tire_type as string || '',
      autonomy_km: typeof metadata.autonomy_km === 'number' ? metadata.autonomy_km : undefined,
      motor_power_w: typeof metadata.motor_power_w === 'number' ? metadata.motor_power_w : undefined,
      battery_voltage_v: typeof metadata.battery_voltage_v === 'number' ? metadata.battery_voltage_v : undefined,
      weight_kg: typeof metadata.weight_kg === 'number' ? metadata.weight_kg : undefined,
      max_speed_kmh: typeof metadata.max_speed_kmh === 'number' ? metadata.max_speed_kmh : undefined,
      warranty_months: metadata.warranty_months as string || '',
      breakes_details: metadata.breakes_details as string || '',
    };
    return initial;
  };

  const [metadata, setMetadata] = useState<ScooterMetadata>(getInitialMetadata());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Determine if the product belongs to the "patinetes-electricos" category
  const isScooterCategory = useMemo(() => {
    return data.categories?.some(
      (category: Product['categories']) => category.handle === 'patinetes-electricos'
    );
  }, [data.categories]);

  useEffect(() => {
    if (isScooterCategory) {
      setMetadata(getInitialMetadata());
      setErrors({});
    }
  }, [data.metadata, productId, isScooterCategory]);

  const validateField = (name: string, value: string | undefined): string | null => {
    const stringValue = String(value || '').trim();

    if ((name === 'warranty_months' || name === 'breakes_details') && stringValue !== '') {
      const isOnlyNumbers = /^[0-9]+$/.test(stringValue);
      if (isOnlyNumbers) {
        return `El campo '${labelMap[name]}' no puede contener solo números. Por favor, agregue texto descriptivo.`;
      }
    } else if (name === 'tire_size' && stringValue !== '') {
      const isOnlyLetters = /^[a-zA-Z\s]+$/.test(stringValue);
      if (isOnlyLetters) {
        return `El campo '${labelMap[name]}' no puede contener solo letras. Debe incluir números (ej. "10x3").`;
      }
    }
    return null;
  };

  const handleChange = (name: string, value: string | number | undefined, type?: string) => {
    let newValue: string | number | undefined = value;

    if (type === 'number') {
      newValue = (value as string).trim() === '' ? undefined : (isNaN(Number(value)) ? undefined : Number(value));
    }

    setMetadata(prev => ({ ...prev, [name]: newValue }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, String(newValue)) }));
  };

  const handleSave = async () => {
    let hasErrors = false;
    const newErrors: Record<string, string | null> = {};

    // Re-validate all fields before saving
    for (const key in metadata) {
      if (Object.prototype.hasOwnProperty.call(metadata, key)) {
        const error = validateField(key, String(metadata[key as keyof ScooterMetadata]));
        if (error) {
          newErrors[key] = error;
          hasErrors = true;
        } else {
          newErrors[key] = null;
        }
      }
    }

    setErrors(newErrors);
    if (hasErrors) {
      toast.error('Corrige los errores antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const updatedProductMetadata: Record<string, any> = { ...data.metadata };

      for (const key in metadata) {
        const value = metadata[key as keyof ScooterMetadata];

        // Remove if empty or undefined, otherwise set the value
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          if (Object.prototype.hasOwnProperty.call(updatedProductMetadata, key)) {
            delete updatedProductMetadata[key];
          }
        } else {
          updatedProductMetadata[key] = value;
        }
      }

      await sdk.admin.product.update(productId, { metadata: updatedProductMetadata });
      toast.success('Metadatos guardados!');
    } catch (err: any) {
      console.error('ERROR: Fallo al guardar metadatos:', err);
      toast.error(`Error al guardar: ${err.message || 'Desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isScooterCategory) {
    return null; // Don't render the widget if it's not a scooter product
  }

  return (
    <Container className="p-3 bg-ui-bg-base rounded-lg shadow-sm">
      <Heading level="h2" className="mb-3 text-ui-fg-base text-lg">Metadatos de Scooter</Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4">
        {[
          { key: 'dgt', label: 'Homologación DGT', options: dgtOptions },
          { key: 'motor_type', label: 'Tipo de Motor', options: motorTypeOptions },
          { key: 'hydraulic_brakes', label: 'Frenos Hidráulicos', options: hydraulicBrakesOptions },
          { key: 'tire_grip_type', label: 'Tipo de Agarre Neumático', options: gripTypeOptions },
          { key: 'tire_type', label: 'Tipo de Neumático', options: tireTypeOptions },
        ].map(({ key, label, options }) => (
          <div key={key} className="flex flex-col gap-y-0.5">
            <Label htmlFor={key} className="text-ui-fg-subtle text-xs">{label}</Label>
            <Select
              name={key}
              value={String(metadata[key as keyof ScooterMetadata] || '')}
              onValueChange={(value) => handleChange(key, value, 'text')}
            >
              <Select.Trigger id={key} className="h-8">
                <Select.Value placeholder="Seleccionar" />
              </Select.Trigger>
              <Select.Content>
                {options.map(option => <Select.Item key={option} value={option}>{option}</Select.Item>)}
              </Select.Content>
            </Select>
          </div>
        ))}

        {[
          { key: 'tire_size', label: 'Tamaño Neumático', placeholder: 'Ej: 10"x3' },
          { key: 'warranty_months', label: 'Garantía (meses/texto)', placeholder: 'Ej: 24 meses o 2 años' },
          { key: 'breakes_details', label: 'Detalles de Frenado', placeholder: 'Ej: Disco delantero y trasero' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-y-0.5">
            <Label htmlFor={key} className="text-ui-fg-subtle text-xs">{label}</Label>
            <Input
              type="text"
              id={key}
              name={key}
              value={metadata[key as keyof ScooterMetadata] || ''}
              onChange={(e) => handleChange(key, e.target.value, 'text')}
              placeholder={placeholder}
              className="h-8"
            />
            {errors[key] && (
              <p className="text-rose-500 text-xs mt-1">{errors[key]}</p>
            )}
          </div>
        ))}

        {[
          { key: 'autonomy_km', label: 'Autonomía (km)', placeholder: '50' },
          { key: 'motor_power_w', label: 'Potencia Motor (W)', placeholder: '1000' },
          { key: 'battery_voltage_v', label: 'Voltaje Batería (V)', placeholder: '48' },
          { key: 'weight_kg', label: 'Peso (kg)', placeholder: '15' },
          { key: 'max_speed_kmh', label: 'Velocidad Máxima (km/h)', placeholder: '25' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-y-0.5">
            <Label htmlFor={key} className="text-ui-fg-subtle text-xs">{label}</Label>
            <Input
              type="number" id={key} name={key}
              value={metadata[key as keyof ScooterMetadata] !== undefined ? metadata[key as keyof ScooterMetadata] : ''}
              onChange={(e) => handleChange(key, e.target.value, 'number')}
              min={0} step={1}
              placeholder={`Ej: ${placeholder}`}
              className="h-8"
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving || Object.values(errors).some(e => e !== null)} className="w-full h-9 text-sm">
        {saving ? 'Guardando...' : 'Guardar Metadatos'}
      </Button>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ScooterMetadataWidget;