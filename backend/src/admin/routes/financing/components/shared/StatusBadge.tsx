import { Badge } from "@medusajs/ui";
import { StatusBadgeProps } from "../../types";
import { STATUS_COLORS, STATUS_ICONS } from "../../constants";

const StatusBadge = ({ status, size = 'medium', showIcon = true }: StatusBadgeProps) => {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
  const icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || '';

  return (
    <Badge 
      size={size}
      className={`${colorClass} font-medium`}
    >
      {showIcon && icon && <span className="mr-1">{icon}</span>}
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
    </Badge>
  );
};

export default StatusBadge;