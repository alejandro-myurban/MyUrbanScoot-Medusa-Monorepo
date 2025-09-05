import { CONTACTED_OPTIONS } from "../../constants";

interface ContactedFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ContactedFilter = ({ value, onChange, className = "" }: ContactedFilterProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${className}`}
    >
      {CONTACTED_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default ContactedFilter;