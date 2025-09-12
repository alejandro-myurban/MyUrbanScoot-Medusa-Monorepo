// components/RecambiosMetadataWidget.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { DetailWidgetProps, AdminProduct, Product } from '@medusajs/framework/types';
import { sdk } from '../lib/sdk';
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Select, Heading, Label, Text } from "@medusajs/ui";
import { ExclamationCircle } from '@medusajs/icons';

interface RecambioMetadata {
  // Neumáticos
  tire_size?: string;
  tire_grip_type?: string;
  tire_type?: string;
  
  // Cámaras
  tube_size?: string;
  valve_type?: string;
  
  // Baterías
  battery_voltage?: string;
  battery_amperage_min?: number;
  battery_amperage_max?: number;
  
  // Cargadores
  charger_voltage?: string;
  charger_connector?: string;
  
  // General
  size_general?: string;
}

// Configuración de campos por tipo de recambio
const recambiosConfig = {
  neumaticos: [
    { key: 'tire_size', label: 'Tamaño Neumático', type: 'text', placeholder: 'Ej: 10x3, 8.5x2' },
    { key: 'tire_grip_type', label: 'Tipo Agarre', type: 'select', options: ["Liso", "Offroad (taco)", "Mixto"] },
    { key: 'tire_type', label: 'Tipo Neumático', type: 'select', options: ["Tubeless", "Con cámara", "Macizo"] }
  ],
  camaras: [
    { key: 'tube_size', label: 'Tamaño', type: 'text', placeholder: 'Ej: 10x3, 8.5x2' },
    { key: 'valve_type', label: 'Tipo Válvula', type: 'select', options: ["Presta", "Schrader", "Dunlop"] }
  ],
  baterias: [
    { key: 'battery_voltage', label: 'Voltaje', type: 'select', options: ["24V", "36V", "48V", "52V", "60V", "72V"] },
    { key: 'battery_amperage_min', label: 'Amperaje Mínimo (Ah)', type: 'number', placeholder: '5' },
    { key: 'battery_amperage_max', label: 'Amperaje Máximo (Ah)', type: 'number', placeholder: '20' }
  ],
  cargadores: [
    { key: 'charger_voltage', label: 'Voltaje', type: 'select', options: ["24V", "36V", "48V", "52V", "60V", "72V"] },
    { key: 'charger_connector', label: 'Conector', type: 'select', options: ["GX16-3", "DC 5.5x2.1", "Anderson", "XT60", "XLR", "RCA"] }
  ],
  otros: [
    { key: 'size_general', label: 'Tamaño/Medida', type: 'text', placeholder: 'Medidas o especificaciones generales' }
  ]
} as const;

// Mapeo de handles de colección a tipos de recambio
const collectionHandleToType: Record<string, keyof typeof recambiosConfig> = {
  'neumaticos': 'neumaticos',
  'ruedas': 'neumaticos',
  'wheels': 'neumaticos',
  'camaras': 'camaras',
  'tubes': 'camaras',
  'baterias': 'baterias',
  'batteries': 'baterias',
  'cargadores': 'cargadores',
  'chargers': 'cargadores'
};

type FieldKey = string;
type FieldMap = Record<string, any>;

const labelMap: Record<string, string> = {
  tire_size: 'Tamaño Neumático',
  tire_grip_type: 'Tipo Agarre',
  tire_type: 'Tipo Neumático',
  tube_size: 'Tamaño',
  valve_type: 'Tipo Válvula',
  battery_voltage: 'Voltaje',
  battery_amperage_min: 'Amperaje Mínimo (Ah)',
  battery_amperage_max: 'Amperaje Máximo (Ah)',
  charger_voltage: 'Voltaje',
  charger_connector: 'Conector',
  size_general: 'Tamaño/Medida'
};

const RecambiosMetadataWidget: React.FC<DetailWidgetProps<AdminProduct>> = ({ data }) => {
  // Detectar si es un producto de recambios
  const sparePartType = useMemo(() => {
    // Buscar en collections del producto
    if (data.collection) {
      const handle = data.collection.handle?.toLowerCase() || '';
      const foundType = Object.keys(collectionHandleToType).find(key => 
        handle.includes(key)
      );
      if (foundType) {
        return collectionHandleToType[foundType];
      }
    }
    
    // Buscar en categorías del producto
    const categoryHandles = data.categories?.map(cat => cat.handle?.toLowerCase() || '') || [];
    for (const categoryHandle of categoryHandles) {
      const foundType = Object.keys(collectionHandleToType).find(key => 
        categoryHandle.includes(key)
      );
      if (foundType) {
        return collectionHandleToType[foundType];
      }
    }
    
    return null;
  }, [data.collection, data.categories]);

  const [metadata, setMetadata] = useState<FieldMap>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Inicializar metadata cuando cambie el producto
  useEffect(() => {
    if (sparePartType && data.metadata) {
      const currentFields = recambiosConfig[sparePartType] || [];
      const initialMetadata: FieldMap = {};
      
      currentFields.forEach(field => {
        const value = data.metadata?.[field.key];
        if (field.type === 'number') {
          initialMetadata[field.key] = typeof value === 'number' ? value : undefined;
        } else {
          initialMetadata[field.key] = value as string || '';
        }
      });
      
      setMetadata(initialMetadata);
      setErrors({});
    }
  }, [data.id, data.metadata, sparePartType]);

  const validateField = (name: string, value: string | number | undefined): string | null => {
    // Validaciones específicas si es necesario
    if (name.includes('amperage') && typeof value === 'number' && value < 0) {
      return `${labelMap[name]} no puede ser negativo`;
    }
    return null;
  };

  const validateAllFields = (): boolean => {
    if (!sparePartType) return true;
    
    const currentFields = recambiosConfig[sparePartType] || [];
    const newErrors: Record<string, string | null> = {};
    let hasErrors = false;
    
    currentFields.forEach(field => {
      const value = metadata[field.key];
      const error = validateField(field.key, value);
      if (error) {
        newErrors[field.key] = error;
        hasErrors = true;
      } else {
        newErrors[field.key] = null;
      }
    });
    
    // Validación específica para baterías: amperage_max debe ser >= amperage_min
    if (sparePartType === 'baterias') {
      const min = metadata.battery_amperage_min;
      const max = metadata.battery_amperage_max;
      if (min && max && typeof min === 'number' && typeof max === 'number' && max < min) {
        newErrors.battery_amperage_max = 'El amperaje máximo debe ser mayor o igual al mínimo';
        hasErrors = true;
      }
    }
    
    setErrors(newErrors);
    return !hasErrors;
  };

  const handleChange = (key: string, value: string) => {
    if (!sparePartType) return;
    
    const currentFields = recambiosConfig[sparePartType] || [];
    const field = currentFields.find(f => f.key === key);
    if (!field) return;
    
    let newValue: any;
    if (field.type === 'number') {
      newValue = value.trim() === '' ? undefined : Number(value);
    } else {
      newValue = value;
    }
    
    setMetadata(prev => ({ ...prev, [key]: newValue }));
    
    // Validar el campo
    const error = validateField(key, newValue);
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      toast.error('Corrige los errores antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const updatedMetadata: Record<string, any> = { ...data.metadata };
      
      if (sparePartType) {
        const currentFields = recambiosConfig[sparePartType] || [];
        currentFields.forEach(field => {
          const value = metadata[field.key];
          // Eliminar campos undefined, mantener los demás
          if (value === undefined || value === '') {
            delete updatedMetadata[field.key];
          } else {
            updatedMetadata[field.key] = value;
          }
        });
      }
      
      await sdk.admin.product.update(data.id, { metadata: updatedMetadata });
      toast.success('Metadatos de recambio guardados!');
    } catch (err: any) {
      console.error('ERROR: Fallo al guardar metadatos de recambio:', err);
      toast.error(`Error al guardar: ${err.message || 'Desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  // No mostrar el widget si no es un producto de recambios
  if (!sparePartType) {
    return null;
  }

  const currentFields = recambiosConfig[sparePartType] || [];
  const typeLabel = {
    neumaticos: 'Neumáticos',
    camaras: 'Cámaras',
    baterias: 'Baterías',
    cargadores: 'Cargadores',
    otros: 'Otros Recambios'
  }[sparePartType] || 'Recambios';

  return (
    <Container className="p-3 bg-ui-bg-base rounded-lg shadow-sm">
      <Heading level="h2" className="mb-3 text-ui-fg-base text-lg">
        Metadatos de {typeLabel}
      </Heading>
      
      {currentFields.length === 0 ? (
        <Text className="text-ui-fg-subtle">
          No hay campos específicos para este tipo de recambio.
        </Text>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4">
            {currentFields.map(field => {
              const hasError = !!errors[field.key];
              const value = metadata[field.key];
              return (
                <div key={field.key} className="flex flex-col gap-y-0.5">
                  <Label htmlFor={field.key} className="text-ui-fg-subtle text-xs">
                    {field.label}
                  </Label>
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
                        {field.options?.map(option => (
                          <Select.Item key={option} value={option}>{option}</Select.Item>
                        ))}
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
                      step={field.type === 'number' ? 0.1 : undefined}
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
            Guardar Metadatos de {typeLabel}
          </Button>
        </>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default RecambiosMetadataWidget;