import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { Button, toast } from "@medusajs/ui";
import { Editor } from "@tinymce/tinymce-react";
import { sdk } from "../lib/sdk";
import { useState } from "react";

// @ts-ignore
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

export default function TextEditorTinyMCE({
  data,
}: DetailWidgetProps<AdminProduct>) {
  const [content, setContent] = useState(data.description || "");
  const [loading, setLoading] = useState(false);

  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
  };

  const saveContent = async () => {
    setLoading(true);
    try {
      const updatedProduct = await sdk.admin.product.update(data.id, {
        description: content,
      });
      toast.success("Descripción guardada exitosamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("No se pudo guardar la descripción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Editor
        onEditorChange={handleEditorChange}
        apiKey={TINYMCE_API_KEY}
        init={{
          plugins: [
            // Core editing features
            "anchor",
            "autolink",
            "charmap",
            "codesample",
            "emoticons",
            "image",
            "link",
            "lists",
            "media",
            "searchreplace",
            "table",
            "visualblocks",
            "wordcount",
            // Your account includes a free trial of TinyMCE premium features
            // Try the most popular premium features until May 26, 2025:
          ],
          content_style: `
          body {
            background-color: #212124; /* equiv. Tailwind gray-100 */
          }
        `,
          value: content,
          skin: "oxide-dark",
          content_css: "tinymce-5-dark",
          toolbar:
            "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat",
          tinycomments_mode: "embedded",
          tinycomments_author: "Author name",
          mergetags_list: [
            { value: "First.Name", title: "First Name" },
            { value: "Email", title: "Email" },
          ],
          ai_request: (request, respondWith) =>
            respondWith.string(() =>
              Promise.reject("See docs to implement AI Assistant")
            ),
        }}
        initialValue={data.description || ""}
      />
      <div className="mt-4 flex">
        <Button
          disabled={loading}
          onClick={saveContent}
          className="b text-white py-2 px-4 rounded"
        >
          Guardar Descripción
        </Button>
      </div>
    </div>
  );
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
});
