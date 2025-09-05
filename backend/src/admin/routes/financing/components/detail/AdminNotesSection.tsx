import { useState } from "react";
import { Button, Text } from "@medusajs/ui";
import { Save, Edit } from "lucide-react";
import { AdminNotesSectionProps } from "../../types";

const AdminNotesSection = ({
  notes,
  onNotesChange,
  onSave,
  isSaving
}: AdminNotesSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes || '');

  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalNotes(notes || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text className="text-lg font-semibold">Notas Administrativas</Text>
        
        {!isEditing && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={localNotes}
            onChange={(e) => {
              setLocalNotes(e.target.value);
              onNotesChange(e.target.value);
            }}
            placeholder="Agregar notas administrativas internas..."
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            
            <Button
              variant="secondary"
              size="small"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-h-[100px] p-4 bg-gray-50 rounded-lg">
          {notes ? (
            <Text className="whitespace-pre-wrap">{notes}</Text>
          ) : (
            <Text className="text-gray-500 italic">
              No hay notas administrativas. Haz clic en "Editar" para agregar notas internas.
            </Text>
          )}
        </div>
      )}

      <Text size="small" className="text-gray-500">
        Estas notas son internas y no son visibles para el cliente
      </Text>
    </div>
  );
};

export default AdminNotesSection;