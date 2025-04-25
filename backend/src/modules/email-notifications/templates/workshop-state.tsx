import { Text } from "@react-email/components";
import * as React from "react";
import { Base } from "./base";

export const WORKSHOP_STATUS = "workshop-status";

export interface NewTemplateProps {
  greeting: string;
  actionUrl: string;
  preview?: string;
}

export const isNewTemplateData = (data: any): data is NewTemplateProps =>
  typeof data.greeting === "string" && typeof data.actionUrl === "string";

export const WorkshopStatus = ({
  greeting,
  actionUrl,
  preview = "You have a new message",
}: NewTemplateProps) => (
  <Base preview={preview}>
    <Text>{greeting}</Text>
    <Text>
      Click <a href={actionUrl}>here</a> to take action.
    </Text>
  </Base>
);

// Add preview props for the email dev server
WorkshopStatus.PreviewProps = {
  greeting: "Hello there!",
  actionUrl: "https://example.com/action",
  preview: "Preview of the new template",
} as NewTemplateProps;
