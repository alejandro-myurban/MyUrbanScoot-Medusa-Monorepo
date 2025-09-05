import { Badge } from "@medusajs/ui";

interface ContactedBadgeProps {
  contacted: boolean | undefined;
  size?: 'small' | 'medium' | 'large';
}

const ContactedBadge = ({ contacted, size = 'small' }: ContactedBadgeProps) => {
  if (contacted === undefined || contacted === null) {
    return (
      <Badge size={size} className="bg-gray-100 text-gray-600 border-gray-200">
        -
      </Badge>
    );
  }

  return (
    <Badge 
      size={size}
      className={contacted 
        ? "bg-green-100 text-green-800 border-green-200" 
        : "bg-red-100 text-red-800 border-red-200"
      }
    >
      {contacted ? '✅ Contactado' : '❌ Sin contactar'}
    </Badge>
  );
};

export default ContactedBadge;