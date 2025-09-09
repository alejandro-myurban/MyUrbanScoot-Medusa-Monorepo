// Status options and configuration
export const STATUS_OPTIONS = [
  { value: "pending", label: "Pendientes", icon: "🕐" },
  { value: "budgeted", label: "Presupuestados", icon: "💰" },
  { value: "missing_docs", label: "Falta documentación", icon: "📋" },
  { value: "denied", label: "Denegados", icon: "❌" },
  { value: "cancelled", label: "Canceladas", icon: "🚫" },
  { value: "pre_accepted", label: "Preaceptadas", icon: "👀" },
  { value: "under_review", label: "En revisión", icon: "🔍" },
  { value: "in_force", label: "En vigor", icon: "✅" },
  { value: "in_software", label: "En software", icon: "💻" },
  { value: "delivered", label: "Entregados", icon: "📦" },
];

export const STATUS_COLORS = {
  pending: "bg-gray-50 text-yellow-800 border-yellow-200",
  budgeted: "bg-blue-100 text-blue-800 border-blue-200",
  missing_docs: "bg-orange-100 text-orange-800 border-orange-200",
  denied: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  pre_accepted: "bg-purple-100 text-purple-800 border-purple-200",
  under_review: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_force: "bg-green-100 text-green-800 border-green-200",
  in_software: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const STATUS_ICONS = {
  pending: "🕐",
  budgeted: "💰",
  missing_docs: "📋",
  denied: "❌",
  cancelled: "🚫",
  pre_accepted: "👀",
  under_review: "🔍",
  in_force: "✅",
  in_software: "💻",
  delivered: "📦",
};

// Contract type options and configuration
export const CONTRACT_TYPE_OPTIONS = [
  { value: "employee_permanent", label: "Empleado Fijo" },
  { value: "employee_temporary", label: "Empleado Temporal" },
  { value: "freelancer", label: "Autónomo" },
  { value: "pensioner", label: "Pensionista" },
  { value: "unemployed", label: "Desempleado" },
];

export const CONTRACT_TYPE_LABELS = {
  employee: "Empleado",
  employee_permanent: "Empleado Fijo",
  employee_temporary: "Empleado Temporal",
  freelance: "Autónomo",
  freelancer: "Autónomo",
  pensioner: "Pensionista",
  unemployed: "Desempleado",
};

export const CONTRACT_TYPE_COLORS = {
  employee_permanent: "text-black dark:text-white border-black",
  employee_temporary: "text-black dark:text-white border-black",
  employee: "text-black dark:text-white border-black",
  freelance: "text-black dark:text-white border-black",
  pensioner: "text-black dark:text-white border-black",
  unemployed: "text-black dark:text-white border-black",
};

// Civil status options
export const CIVIL_STATUS_OPTIONS = [
  { value: "single", label: "Soltero/a" },
  { value: "married", label: "Casado/a" },
  { value: "divorced", label: "Divorciado/a" },
  { value: "widowed", label: "Viudo/a" },
  { value: "separated", label: "Separado/a" },
];

// Housing type options
export const HOUSING_TYPE_OPTIONS = [
  { value: "rent", label: "Alquiler" },
  { value: "owned", label: "Propiedad" },
  { value: "partner", label: "Cónyuge" },
  { value: "family", label: "Padres" },
  { value: "leasing", label: "Leasing" },
  { value: "usufruct", label: "Usufructo" },
  { value: "other", label: "Otra" },
];

// Contacted filter options
export const CONTACTED_OPTIONS = [
  { value: "", label: "Todos (contactado)" },
  { value: "contacted", label: "✅ Contactados" },
  { value: "not_contacted", label: "❌ No contactados" },
];

// Pagination configuration
export const ITEMS_PER_PAGE = 30;

// Field validation rules
export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    required: true,
    minLength: 9,
    pattern: /^[0-9+\s-()]+$/,
  },
  postal_code: {
    required: true,
    minLength: 5,
    maxLength: 5,
    pattern: /^\d{5}$/,
  },
  income: {
    required: true,
    pattern: /^\d+(\.\d{2})?$/,
  },
};

// Document types for download functionality
export const DOCUMENT_TYPES = [
  { key: "identity_front_file_id", label: "DNI Frontal", icon: "🆔" },
  { key: "identity_back_file_id", label: "DNI Trasero", icon: "🆔" },
  { key: "paysheet_file_id", label: "Nómina", icon: "💰" },
  { key: "freelance_rental_file_id", label: "Modelo 036/037", icon: "📄" },
  { key: "freelance_quote_file_id", label: "Factura ejemplo", icon: "🧾" },
  { key: "pensioner_proof_file_id", label: "Justificante pensión", icon: "👴" },
  { key: "bank_account_proof_file_id", label: "Extracto bancario", icon: "🏦" },
];

// Default filter state
export const DEFAULT_FILTERS = {
  contractType: "",
  searchTerm: "",
  status: "",
  contacted: "",
  showCancelledDelivered: false,
};

// Financing installment options
export const INSTALLMENT_COUNT_OPTIONS = [
  { value: "12", label: "12 meses" },
  { value: "18", label: "18 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "60", label: "60 meses" },
];

// Form field configurations
export const FORM_FIELDS = {
  personalInfo: [
    "email",
    "address",
    "postal_code",
    "city",
    "province",
    "phone_mumber",
    "civil_status",
    "housing_type",
  ],
  workInfo: [
    "contract_type",
    "company_position",
    "company_start_date",
    "freelance_start_date",
    "income",
  ],
  financingInfo: ["financing_installment_count", "doubts"],
};

// Function exports for option arrays (used by components)
export const getCivilStatusOptions = () => CIVIL_STATUS_OPTIONS;
export const getHousingTypeOptions = () => HOUSING_TYPE_OPTIONS;
export const getContractTypeOptions = () => CONTRACT_TYPE_OPTIONS;
export const getInstallmentOptions = () => INSTALLMENT_COUNT_OPTIONS;
export const getStatusOptions = () => STATUS_OPTIONS;
export const getContactedOptions = () => CONTACTED_OPTIONS;
