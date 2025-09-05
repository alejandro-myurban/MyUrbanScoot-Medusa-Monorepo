import { Text } from "@medusajs/ui";

interface ShowCancelledFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const ShowCancelledFilter = ({ checked, onChange, className = "" }: ShowCancelledFilterProps) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <Text size="small" className="text-gray-700">
        Mostrar canceladas/entregadas
      </Text>
    </label>
  );
};

export default ShowCancelledFilter;