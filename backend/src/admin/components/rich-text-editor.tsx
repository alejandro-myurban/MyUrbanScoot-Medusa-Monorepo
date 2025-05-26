import React from "react"
import { Editor } from "@tinymce/tinymce-react"
import { Button, toast } from "@medusajs/ui"

// Key for TinyMCE (env variable)
// @ts-ignore
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY

export interface RichTextEditorProps {
  /** Valor controlado del contenido HTML */
  value: string
  /** Callback al cambiar contenido */
  onChange: (content: string) => void
  /** Handler opcional para el botón de guardar */
  onSave?: () => Promise<void>
  /** Indicador de loading para el botón */
  saveLoading?: boolean
}

export default function RichTextEditor({
  value,
  onChange,
  onSave,
  saveLoading,
}: RichTextEditorProps) {
  const handleEditorChange = (newContent: string) => {
    onChange(newContent)
  }

  const handleSave = async () => {
    if (!onSave) return
    try {
      await onSave()
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error("No se pudo guardar el contenido")
    }
  }

  return (
    <div>
      <Editor
        apiKey={TINYMCE_API_KEY}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          plugins: [
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
          content_style: `body { background-color: #212124; }`,
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
      />
      {onSave && (
        <div className="mt-4 flex">
          {/* <Button onClick={handleSave} isLoading={saveLoading}>
            Guardar
          </Button> */}
        </div>
      )}
    </div>
  )
}
