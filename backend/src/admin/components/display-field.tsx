import React from 'react';
import { Text } from "@medusajs/ui";
import { Copy } from "lucide-react";

interface DisplayFieldProps {
  label: string;
  value: any;
  required?: boolean;
  showCopy?: boolean;
}

const DisplayField: React.FC<DisplayFieldProps> = ({
  label,
  value,
  required = false,
  showCopy = true
}) => {
  const [showCopyFeedback, setShowCopyFeedback] = React.useState(false);

  const handleCopy = async () => {
    if (value === null || value === undefined || value === '') return;
    
    let textToCopy = '';
    
    if (typeof value === 'object') {
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

  const formatDisplayValue = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-400 italic">No especificado</span>;
    }

    if (typeof val === 'boolean') {
      return val ? '✅ Sí' : '❌ No';
    }

    return val.toString();
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="group flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
        <span className="flex-1">
          {formatDisplayValue(value)}
        </span>
        {/* Botón de copiar - solo si hay valor y showCopy está habilitado */}
        {showCopy && value !== null && value !== undefined && value !== '' && (
          <div className="flex items-center gap-1 ml-2">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayField;