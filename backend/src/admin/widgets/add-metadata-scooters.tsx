// components/ScooterMetadataWidget.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { DetailWidgetProps, AdminProduct, Product } from '@medusajs/framework/types';
import { sdk } from '../lib/sdk';
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Select, Heading, Label, Text } from "@medusajs/ui";
import { ExclamationCircle } from '@medusajs/icons';

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
}

// Única fuente de verdad para toda la configuración del formulario 🚀
const fieldsConfig = [
  { key: 'dgt', label: 'Homologación DGT', type: 'select', options: ["DGT", "NO DGT"] },
  { key: 'motor_type', label: 'Tipo de Motor', type: 'select', options: ["single", "dual"] },
  { key: 'hydraulic_brakes', label: 'Frenos Hidráulicos', type: 'select', options: ["yes", "no"] },
  { key: 'tire_grip_type', label: 'Tipo de Agarre Neumático', type: 'select', options: ["offroad (Taco)", "smooth", "mixed"] },
  { key: 'tire_type', label: 'Tipo de Neumático', type: 'select', options: ["Tubeless", "Tube", "Solid"] },
  { key: 'tire_size', label: 'Tamaño Neumático', type: 'text', placeholder: 'Ej: 10"x3', validate: (v: string) => !v.match(/\d/) ? 'Debe incluir números (ej. "10x3").' : null },
  { key: 'warranty_months', label: 'Garantía', type: 'text', placeholder: 'Ej: 24 meses o 2 años', validate: (v: string) => /^\d+$/.test(v) ? 'No puede contener solo números. Agregue texto.' : null },
  { key: 'breakes_details', label: 'Detalles de Frenado', type: 'text', placeholder: 'Ej: Disco delantero y trasero', validate: (v: string) => /^\d+$/.test(v) ? 'No puede contener solo números. Agregue texto.' : null },
  { key: 'autonomy_km', label: 'Autonomía (km)', type: 'number', placeholder: '50' },
  { key: 'motor_power_w', label: 'Potencia Motor (W)', type: 'number', placeholder: '1000' },
  { key: 'battery_voltage_v', label: 'Voltaje Batería (V)', type: 'number', placeholder: '48' },
  { key: 'weight_kg', label: 'Peso (kg)', type: 'number', placeholder: '15' },
  { key: 'max_speed_kmh', label: 'Velocidad Máxima (km/h)', type: 'number', placeholder: '25' },
] as const;

// Tipos inferidos del array de configuración
type FieldKey = typeof fieldsConfig[number]['key'];
type FieldMap = {
  [K in FieldKey]?: K extends keyof ScooterMetadata ? ScooterMetadata[K] : never;
};

const labelMap: Record<FieldKey, string> = {
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

const getInitialMetadata = (data: AdminProduct): FieldMap => {
  const metadata = data.metadata || {};
  const initial: FieldMap = {};
  fieldsConfig.forEach(field => {
    const value = metadata[field.key as keyof ScooterMetadata];
    if (field.type === 'number') {
      initial[field.key] = typeof value === 'number' ? value : undefined;
    } else {
      initial[field.key] = value as string || '';
    }
  });
  return initial;
};

const ScooterMetadataWidget: React.FC<DetailWidgetProps<AdminProduct>> = ({ data }) => {
  const isScooterCategory = useMemo(() => {
    return data.categories?.some((category: Product['categories']) => category.handle === 'patinetes-electricos');
  }, [data.categories]);

  const [metadata, setMetadata] = useState<FieldMap>(() => getInitialMetadata(data));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (isScooterCategory) {
      setMetadata(getInitialMetadata(data));
      setErrors({});
    }
  }, [data.id, data.metadata, isScooterCategory]);

  const validateField = (name: string, value: string | undefined): string | null => {
    const stringValue = String(value || '').trim();

    if ((name === 'warranty_months' || name === 'breakes_details') && stringValue !== '') {
      const isOnlyNumbers = /^[0-9]+$/.test(stringValue);
      if (isOnlyNumbers) {
        return `El campo '${labelMap[name as FieldKey]}' no puede contener solo números. Por favor, agregue texto descriptivo.`;
      }
    } else if (name === 'tire_size' && stringValue !== '') {
      const isOnlyLetters = /^[a-zA-Z\s]+$/.test(stringValue);
      if (isOnlyLetters) {
        return `El campo '${labelMap[name as FieldKey]}' no puede contener solo letras. Debe incluir números (ej. "10x3").`;
      }
    }
    return null;
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string | null> = {};
    let hasErrors = false;
    fieldsConfig.forEach(field => {
      if ('validate' in field) {
        const value = metadata[field.key as keyof ScooterMetadata];
        const error = value && field.validate(value as any);
        if (error) {
          newErrors[field.key] = error;
          hasErrors = true;
        } else {
          newErrors[field.key] = null;
        }
      }
    });
    setErrors(newErrors);
    return !hasErrors;
  };

  const handleChange = (key: FieldKey, value: string) => {
    const field = fieldsConfig.find(f => f.key === key);
    if (!field) return;
    
    let newValue: any;
    if (field.type === 'number') {
      newValue = (value as string).trim() === '' ? undefined : Number(value);
    } else {
      newValue = value;
    }
    
    setMetadata(prev => ({ ...prev, [key]: newValue }));
    
    // Validar el campo si tiene regla de validación
    if ('validate' in field) {
      const error = newValue && field.validate(newValue as any);
      setErrors(prev => ({ ...prev, [key]: error }));
    }
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      toast.error('Corrige los errores antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const updatedMetadata: Record<string, any> = { ...data.metadata };
      
      fieldsConfig.forEach(field => {
        const value = metadata[field.key];
        // Eliminar campos undefined, mantener los demás
        if (value === undefined) {
          delete updatedMetadata[field.key];
        } else {
          updatedMetadata[field.key] = value;
        }
      });
      
      await sdk.admin.product.update(data.id, { metadata: updatedMetadata });
      toast.success('Metadatos guardados!');
    } catch (err: any) {
      console.error('ERROR: Fallo al guardar metadatos:', err);
      toast.error(`Error al guardar: ${err.message || 'Desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isScooterCategory) {
    return null;
  }

  return (
    <Container className="p-3 bg-ui-bg-base rounded-lg shadow-sm">
      <Heading level="h2" className="mb-3 text-ui-fg-base text-lg">Metadatos de Scooter</Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4">
        {fieldsConfig.map(field => {
          const hasError = !!errors[field.key];
          const value = metadata[field.key];
          return (
            <div key={field.key} className="flex flex-col gap-y-0.5">
              <Label htmlFor={field.key} className="text-ui-fg-subtle text-xs">{field.label}</Label>
              {field.type === 'select' ? (
                <Select
                  name={field.key}
                  value={String(value || '')}
                  onValueChange={(val) => handleChange(field.key, val)}
                >
                  <Select.Trigger id={field.key} className="h-8">
                    <Select.Value placeholder="Seleccionar" />
                  </Select.Trigger>
                  <Select.Content>
                    {field.options.map(option => <Select.Item key={option} value={option}>{option}</Select.Item>)}
                  </Select.Content>
                </Select>
              ) : (
                <Input
                  type={field.type}
                  id={field.key}
                  name={field.key}
                  value={field.type === 'number' ? (value as number ?? '') : (value as string ?? '')}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8"
                  min={field.type === 'number' ? 0 : undefined}
                  step={field.type === 'number' ? 1 : undefined}
                />
              )}
              {hasError && (
                <div className="flex items-center gap-x-1 mt-1 text-rose-500">
                  <ExclamationCircle />
                  <Text size="small" leading="compact">{errors[field.key]}</Text>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Button
        onClick={handleSave}
        isLoading={saving}
        disabled={saving || Object.values(errors).some(e => e !== null)}
        className="w-full h-9 text-sm"
      >
        Guardar Metadatos
      </Button>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ScooterMetadataWidget;
