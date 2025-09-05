import { Text } from "@medusajs/ui";

interface SequentialIdDisplayProps {
  sequentialId: number;
  className?: string;
}

const SequentialIdDisplay = ({ sequentialId, className = "" }: SequentialIdDisplayProps) => {
  return (
    <Text className={`font-mono text-gray-500 ${className}`}>
      #{sequentialId.toString().padStart(4, '0')}
    </Text>
  );
};

export default SequentialIdDisplay;