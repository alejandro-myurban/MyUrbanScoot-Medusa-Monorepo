import { Text } from "@react-email/components";
import * as React from "react";
import { Base } from "./base";

export const PRODUCT_DELIVERED = "product-delivered";

export interface ProductDeliveredProps {
  greeting: string;
  actionUrl: string;
  preview?: string;
}

export const isProductDeliveredData = (data: any): data is ProductDeliveredProps =>
  typeof data.greeting === "string" && typeof data.actionUrl === "string";

export const ProductDelivered = ({
  greeting,
  actionUrl,
  preview = "You have a new message",
}: ProductDeliveredProps) => (
  <Base preview={preview}>
    <Text>{greeting}</Text>
    <Text>
      Click <a href={actionUrl}>here</a> to take action.
    </Text>
  </Base>
);

// Add preview props for the email dev server
ProductDelivered.PreviewProps = {
  greeting: "Hello there!",
  actionUrl: "https://example.com/action",
  preview: "Preview of the new template",
} as ProductDeliveredProps;
