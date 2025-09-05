import { Text } from "@medusajs/ui";
import React from "react";

const GuideItem = ({
  icon,
  title,
  description,
}: {
  icon: JSX.Element;
  title: string;
  description: string;
}) => (
  <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      {React.cloneElement(icon, {
        className: `${icon.props.className || ""} w-5 h-5 text-gray-700 dark:text-gray-200`,
      })}
      <Text className="font-semibold text-gray-700 dark:text-gray-200 truncate">
        {title}
      </Text>
    </div>
    <Text size="small" className="text-gray-600 dark:text-gray-400">
      {description}
    </Text>
  </div>
);

export default GuideItem;