import { Button, Text } from "@medusajs/ui";
import { Download, FileText } from "lucide-react";
import { DocumentLinkProps } from "../../types";

const DocumentLink = ({ 
  url, 
  label, 
  icon: Icon = FileText, 
  onDownload 
}: DocumentLinkProps) => {
  const hasDocument = Boolean(url);

  if (!hasDocument) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Icon className="w-4 h-4" />
        <Text size="small" className="text-gray-400">
          {label} - No disponible
        </Text>
      </div>
    );
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-blue-500" />
      <Button
        variant="transparent"
        size="small"
        className="p-0 h-auto text-blue-600 hover:text-blue-800"
        onClick={handleDownload}
      >
        <Text size="small">
          {label}
        </Text>
      </Button>
      <Button
        variant="transparent"
        size="small"
        className="p-1 h-auto"
        onClick={handleDownload}
      >
        <Download className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default DocumentLink;