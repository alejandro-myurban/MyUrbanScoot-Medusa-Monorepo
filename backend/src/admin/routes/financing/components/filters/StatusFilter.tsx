import { STATUS_OPTIONS } from "../../constants";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const StatusFilter = ({ value, onChange, className = "" }: StatusFilterProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${className}`}
    >
      <option value="">Todos los estados</option>
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.icon} {option.label}
        </option>
      ))}
    </select>
  );
};

export default StatusFilter;