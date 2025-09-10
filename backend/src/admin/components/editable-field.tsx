import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@medusajs/ui";
import { Edit3, Check, X, Loader2, Copy } from "lucide-react";

type FieldType = 'text' | 'email' | 'textarea' | 'select' | 'select-input' | 'date' | 'boolean' | 'readonly' | 'json-object' | 'tel';

interface EditableFieldProps {
  label: string;
  value: any;
  type: FieldType;
  options?: string[] | { value: string; label: string }[];
  required?: boolean;
  onSave: (value: any) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  type,
  options = [],
  required = false,
  onSave,
  disabled = false,
  placeholder = "",
  minValue,
  maxValue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isCustomInput, setIsCustomInput] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  // Sincronizar valor cuando cambie externamente - SOLO si NO estamos editando
  useEffect(() => {
    if (!isEditing) {  // ← CLAVE: Solo actualizar si no estamos editando
      setCurrentValue(value);
    }
    
    // Para select-input, determinar si el valor actual requiere input personalizado
    if (type === 'select-input' && value && !isEditing) {
      const isPredefineOption = options.some(opt => 
        typeof opt === 'string' ? opt === value : opt.value === value
      );
      setIsCustomInput(!isPredefineOption);
    }
  }, [value, type, options, isEditing]); // ← Agregamos isEditing como dependencia

  // Focus automático cuando se entra en modo edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (type === 'readonly' || disabled) return;
    setIsEditing(true);
    setCurrentValue(value);
    setError("");
    
    // Inicializar estado para select-input
    if (type === 'select-input' && value) {
      const isPredefineOption = options.some(opt => 
        typeof opt === 'string' ? opt === value : opt.value === value
      );
      setIsCustomInput(!isPredefineOption);
    } else {
      setIsCustomInput(false);
    }
  };

  const handleCopy = async () => {
    if (value === null || value === undefined || value === '') return;
    
    let textToCopy = '';
    
    // Para objetos JSON, copiar el JSON formateado
    if (type === 'json-object' && typeof value === 'object') {
      textToCopy = JSON.stringify(value, null, 2);
    } else {
      textToCopy = value.toString();
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentValue(value);
    setError("");
    
    // Reset custom input state para select-input
    if (type === 'select-input' && value) {
      const isPredefineOption = options.some(opt => 
        typeof opt === 'string' ? opt === value : opt.value === value
      );
      setIsCustomInput(!isPredefineOption);
    } else {
      setIsCustomInput(false);
    }
  };

  const handleSave = async () => {
    // Validaciones básicas
    if (required && (!currentValue || currentValue.toString().trim() === '')) {
      setError(`${label} es requerido`);
      return;
    }

    // Validación especial para select-input
    if (type === 'select-input' && currentValue) {
      // Si no es una de las opciones predefinidas, validar como número
      const isPredefineOption = options.some(opt => 
        typeof opt === 'string' ? opt === currentValue : opt.value === currentValue
      );
      
      if (!isPredefineOption) {
        const numValue = parseInt(currentValue);
        if (isNaN(numValue)) {
          setError('El valor debe ser un número válido');
          return;
        }
        
        if (minValue !== undefined && numValue < minValue) {
          setError(`El valor debe ser mayor o igual a ${minValue}`);
          return;
        }
        
        if (maxValue !== undefined && numValue > maxValue) {
          setError(`El valor debe ser menor o igual a ${maxValue}`);
          return;
        }
      }
    }

    // Validación especial para JSON
    if (type === 'json-object' && typeof currentValue === 'string') {
      try {
        JSON.parse(currentValue);
      } catch (error) {
        setError('JSON inválido. Por favor, corrige la sintaxis.');
        return;
      }
    }

    setIsSaving(true);
    setError("");

    try {
      // Para objetos JSON, enviar el objeto parseado
      const valueToSave = type === 'json-object' && typeof currentValue === 'string' 
        ? JSON.parse(currentValue) 
        : currentValue;
      
      await onSave(valueToSave);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplayValue = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-400 italic">No especificado</span>;
    }

    if (type === 'boolean') {
      return val ? '✅ Sí' : '❌ No';
    }

    if (type === 'date' && val) {
      return new Date(val).toLocaleDateString('es-ES');
    }

    // Para selects con opciones de objeto, mostrar la etiqueta correspondiente
    if ((type === 'select' || type === 'select-input') && options.length > 0) {
      const option = options.find(opt => 
        typeof opt === 'string' ? opt === val : opt.value === val
      );
      if (option && typeof option === 'object') {
        return option.label;
      }
      // Para select-input, agregar "meses" al final si es un número
      if (type === 'select-input') {
        return `${val} meses`;
      }
    }

    // Para objetos JSON, mostrar una vista compacta
    if (type === 'json-object' && typeof val === 'object') {
      return (
        <div className="space-y-1">
          <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(val, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    return val.toString();
  };

  const renderInput = () => {
    const baseProps = {
      ref: inputRef as any,
      value: currentValue || '',
      onChange: (e: React.ChangeEvent<any>) => setCurrentValue(e.target.value),
      onKeyDown: handleKeyDown,
      className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      placeholder: placeholder || `Ingrese ${label.toLowerCase()}`,
      disabled: isSaving
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...baseProps}
            rows={3}
            className={`${baseProps.className} resize-vertical`}
          />
        );

      case 'select':
        return (
          <select {...baseProps}>
            <option value="">Seleccionar...</option>
            {options.map((option, index) => {
              if (typeof option === 'string') {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                );
              } else {
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              }
            })}
          </select>
        );

      case 'select-input':
        return (
          <div className="space-y-2">
            {/* Select con opciones predefinidas + opción personalizar */}
            <select 
              {...baseProps}
              onChange={(e) => {
                const selectedValue = e.target.value;
                if (selectedValue === 'custom') {
                  setIsCustomInput(true);
                  setCurrentValue('');
                } else {
                  setIsCustomInput(false);
                  setCurrentValue(selectedValue);
                }
              }}
              value={isCustomInput ? 'custom' : currentValue || ''}
            >
              <option value="">Seleccionar...</option>
              {options.map((option, index) => {
                if (typeof option === 'string') {
                  return (
                    <option key={option} value={option}>
                      {option} meses
                    </option>
                  );
                } else {
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                }
              })}
              <option value="custom">✏️ Personalizar (12-60 meses)</option>
            </select>
            
            {/* Input personalizado que aparece cuando se selecciona "Personalizar" */}
            {isCustomInput && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={minValue || 12}
                  max={maxValue || 60}
                  value={currentValue || ''}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Ingrese número entre ${minValue || 12} y ${maxValue || 60}`}
                  disabled={isSaving}
                />
                <span className="text-sm text-gray-500">meses</span>
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <input
            {...baseProps}
            type="date"
          />
        );

      case 'email':
        return (
          <input
            {...baseProps}
            type="email"
          />
        );

      case 'boolean':
        return (
          <select {...baseProps}>
            <option value="">Seleccionar...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );

      case 'json-object':
        return (
          <textarea
            {...baseProps}
            rows={8}
            className={`${baseProps.className} resize-vertical font-mono text-xs`}
            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue || ''}
            onChange={(e) => {
              try {
                const parsedValue = JSON.parse(e.target.value);
                setCurrentValue(parsedValue);
              } catch (error) {
                // Si no es JSON válido, mantener como string para permitir edición
                setCurrentValue(e.target.value);
              }
            }}
          />
        );

      default:
        return (
          <input
            {...baseProps}
            type="text"
          />
        );
    }
  };

  if (type === 'readonly') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
          {formatDisplayValue(value)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          {renderInput()}
          
          {error && (
            <div className="text-red-600 text-xs">
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="small"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Guardar
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="group flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
          <span className={`flex-1 ${label === 'Ingresos Mensuales (Declarados)' ? 'text-green-600 font-semibold' : ''}`}>
            {formatDisplayValue(value)}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {/* Botón de copiar - solo si hay valor */}
            {value !== null && value !== undefined && value !== '' && (
              <button
                onClick={handleCopy}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors relative"
                title="Copiar valor"
              >
                <Copy className="w-4 h-4" />
                {showCopyFeedback && (
                  <span className="absolute -top-8 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ¡Copiado!
                  </span>
                )}
              </button>
            )}
            {/* Botón de editar - solo si no está deshabilitado */}
            {!disabled && (
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Editar campo"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableField;