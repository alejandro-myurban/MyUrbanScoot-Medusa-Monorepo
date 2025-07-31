import { CheckCircle2, Trash2, Upload } from "lucide-react"

export interface FileStates {
  identity_front_file_id: File | null
  identity_back_file_id: File | null
  paysheet_file: File | null
  freelance_rental_file: File | null
  freelance_quote_file: File | null
  pensioner_proof_file: File | null
  bank_account_proof_file: File | null
}

export const FileInput = ({
  id,
  label,
  file,
  onRemove,
  required = false,
  onChange,
  disabled = false,
  multiple = false
}: {
  id: keyof FileStates
  label: string
  file: File | null
  onRemove: (id: keyof FileStates) => void
  required?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  multiple?: boolean
}) => (
  <div className="space-y-3">
    <label className="block text-sm font-semibold text-gray-800">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {file ? (
      <div className="flex items-center justify-between p-4 border border-green-200 rounded-xl bg-green-50 shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)] transition-all duration-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-green-800 truncate">
              {file.name}
            </p>
            <p className="text-xs text-green-600">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200"
        >
          <Trash2 size={18} />
        </button>
      </div>
    ) : (
      <label
        htmlFor={id}
        className="group relative flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 bg-gray-50 transition-all duration-300 shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)]"
      >
        <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
          <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center">
            <Upload size={24} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">Seleccionar archivo</p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, JPG, PNG (máx. 10MB)
            </p>
          </div>
        </div>
        <input
          id={id}
          name={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={onChange}
          disabled={disabled}
          required={required}
          multiple={multiple}
        />
      </label>
    )}
  </div>
)
