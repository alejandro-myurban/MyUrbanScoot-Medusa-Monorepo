import { CONTRACT_TYPE_OPTIONS } from "../../constants";

interface ContractTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ContractTypeFilter = ({ value, onChange, className = "" }: ContractTypeFilterProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${className}`}
    >
      <option value="">Todos los tipos</option>
      {CONTRACT_TYPE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default ContractTypeFilter;