export const FormSelect = ({
  label,
  name,
  required = false,
  value,
  onChange,
  children,
  className = "",
}: {
  label: string
  name: string
  required?: boolean
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  className?: string
}) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-semibold text-gray-800">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      name={name}
      id={name}
      required={required}
      value={value}
      onChange={onChange}
      className={`pt-2 pb-2 block w-full h-12 px-4 mt-0 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)] appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 text-gray-900 ${className}`}
      style={{
        outline: "none",
        boxShadow: "0px 1px 1px rgba(0,0,0,0.03), 0px 3px 6px rgba(0,0,0,0.02)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </select>
  </div>
)
