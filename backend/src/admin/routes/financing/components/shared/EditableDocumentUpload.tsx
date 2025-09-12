import React, { useState, useRef } from 'react';
import { Button, FocusModal, Text } from '@medusajs/ui';
import { Upload, X, FileText, AlertTriangle, Check, Loader2, Edit } from 'lucide-react';

interface EditableDocumentUploadProps {
  label: string;
  currentDocumentUrl?: string;
  documentType: 'identity_front' | 'identity_back' | 'paysheet' | 'bank_account_proof' | 'freelance_rental' | 'freelance_quote' | 'pensioner_proof';
  onReplace: (file: File, documentType: string) => Promise<void>;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

const EditableDocumentUpload: React.FC<EditableDocumentUploadProps> = ({
  label,
  currentDocumentUrl,
  documentType,
  onReplace,
  acceptedTypes = "image/*,application/pdf",
  maxSizeMB = 5
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCurrentDocument = Boolean(currentDocumentUrl);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    // Validar tipo
    const allowedTypes = acceptedTypes.split(',').map(t => t.trim());
    const isValidType = allowedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type === 'application/pdf') return file.type === 'application/pdf';
      return file.type === type;
    });

    if (!isValidType) {
      return `Tipo de archivo no válido. Permitidos: ${acceptedTypes}`;
    }

    // Validar tamaño
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `El archivo es muy grande. Máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const file = fileArray[0]; // Solo tomamos el primer archivo

    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Crear preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onReplace(selectedFile, documentType);
      // Cerrar modal y limpiar estado
      setIsModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (error: any) {
      setError(error.message || 'Error al reemplazar el documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Vista del documento actual
  const renderCurrentDocument = () => {
    if (!hasCurrentDocument) {
      return (
        <div className="flex items-center gap-2 text-gray-400 p-4 border border-gray-200 rounded-lg">
          <FileText className="w-4 h-4" />
          <Text size="small" className="text-gray-400">
            {label} - No disponible
          </Text>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <div>
            <Text size="small" className="text-blue-600 dark:text-gray-300">
              {label}
            </Text>
            <Text size="small" className="text-gray-500">
              Documento disponible
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="transparent"
            size="small"
            onClick={() => {
              // Extraer la primera URL válida si hay múltiples URLs separadas por |
              const cleanUrl = currentDocumentUrl?.split('|')[0] || currentDocumentUrl;
              console.log('🔗 Abriendo URL:', cleanUrl);
              window.open(cleanUrl, '_blank');
            }}
          >
            Ver actual
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsModalOpen(true)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Reemplazar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderCurrentDocument()}

      {/* Modal de reemplazo */}
      <FocusModal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <FocusModal.Content className='max-w-xl mx-auto max-h-[50vh]'>
          <FocusModal.Header>
            <FocusModal.Title>Reemplazar {label}</FocusModal.Title>
          </FocusModal.Header>

          <FocusModal.Body className="space-y-4 p-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <Text size="small" className="text-red-700">
                  {error}
                </Text>
              </div>
            )}

            {/* Área de drag & drop */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${selectedFile ? 'border-green-500 bg-green-50' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <Check className="w-8 h-8 text-green-600 mx-auto" />
                  <div>
                    <Text className="font-medium text-green-700">
                      Archivo seleccionado
                    </Text>
                    <Text size="small" className="text-green-600">
                      {selectedFile.name}
                    </Text>
                    <Text size="small" className="text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </Text>
                  </div>
                  
                  {previewUrl && (
                    <div className="mt-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-w-48 max-h-32 mx-auto rounded border"
                      />
                    </div>
                  )}

                  <Button
                    variant="transparent" 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <div>
                    <Text className="font-medium text-gray-700">
                      Arrastra un archivo aquí o haz clic para seleccionar
                    </Text>
                    <Text size="small" className="text-gray-500">
                      Tipos permitidos: {acceptedTypes} (máx. {maxSizeMB}MB)
                    </Text>
                  </div>
                </div>
              )}
            </div>

            {hasCurrentDocument && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <Text size="small" className="text-yellow-800">
                    <strong>Atención:</strong> Esto reemplazará el documento actual permanentemente.
                    El documento anterior se eliminará del servidor.
                  </Text>
                </div>
              </div>
            )}
          </FocusModal.Body>

          <FocusModal.Footer>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                'Reemplazar Documento'
              )}
            </Button>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>
    </>
  );
};

export default EditableDocumentUpload;