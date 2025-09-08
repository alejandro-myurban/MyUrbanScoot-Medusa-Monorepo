import { Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

const SearchFilter = ({ 
  value, 
  onChange, 
  placeholder = "Buscar por email, DNI, teléfono, dirección...",
  className = "",
  debounceMs = 300
}: SearchFilterProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounced onChange
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [localValue, debounceMs, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-9 pr-3 py-1 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
};

export default SearchFilter;