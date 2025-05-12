import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { toast } from "@medusajs/ui";
import { Editor } from "@tinymce/tinymce-react";
import { sdk } from "../lib/sdk";
import { useState } from "react";

export default function TextEditorTinyMCE({
  data,
}: DetailWidgetProps<AdminProduct>) {
  const [content, setContent] = useState(data.description || "");

  const handleEditorChange = (newContent) => {
    setContent(newContent);
  };

  const saveContent = async () => {
    try {
        console.log("Guardando contenido:", content);
      // Ejemplo de guardado usando el cliente de Medusa
      // Asume que estás actualizando la descripción de un producto
      const updatedProduct = await sdk.admin.product.update(data.id, {
        description: content,
      });
      console.log("jeje",updatedProduct)
      // Muestra notificación de éxito
      toast.success("Descripción guardada exitosamente");
    } catch (error) {
      // Manejo de errores
      console.error("Error al guardar:", error);
      toast.error("No se pudo guardar la descripción");
    }
  };

  return (
    <div>
      <Editor
        onEditorChange={handleEditorChange}
        apiKey="1kedj9oa6ewl5ym7pvre26w4dutsz95rhev19qzgyxz4j4he"
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
            "checklist",
            "mediaembed",
            "casechange",
            "formatpainter",
            "pageembed",
            "a11ychecker",
            "tinymcespellchecker",
            "permanentpen",
            "powerpaste",
            "advtable",
            "advcode",
            "editimage",
            "advtemplate",
            "ai",
            "mentions",
            "tinycomments",
            "tableofcontents",
            "footnotes",
            "mergetags",
            "autocorrect",
            "typography",
            "inlinecss",
            "markdown",
            "importword",
            "exportword",
            "exportpdf",
          ],

          value: content,
          content_css: "dark",
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
        <button
          onClick={saveContent}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Guardar Descripción
        </button>
      </div>
    </div>
  );
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
});