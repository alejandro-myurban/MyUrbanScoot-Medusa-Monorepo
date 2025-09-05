export type FinancingData = {
  id: string;
  email: string;
  identity_front_file_id: string;
  identity_back_file_id: string;
  income: string;
  paysheet_file_id: string | null;
  contract_type: string;
  company_position: string | null;
  company_start_date: string | null;
  freelance_rental_file_id: string | null;
  freelance_quote_file_id: string | null;
  freelance_start_date: string | null;
  pensioner_proof_file_id: string | null;
  bank_account_proof_file_id: string | null;
  financing_installment_count: string;
  housing_type: string;
  housing_type_details: string | null;
  civil_status: string;
  marital_status_details: string | null;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  phone_mumber: string;
  doubts: string | null;
  requested_at: string;
  created_at: string;
  dni_front_verification?: any;
  dni_back_verification?: any;
  payroll_verification?: any;
  bank_verification?: any;
  status: string;
  admin_notes?: string | null;
  contacted?: boolean;
  sequentialId?: string;
};

export type FilterState = {
  contractType: string;
  searchTerm: string;
  status: string;
  contacted: string;
  showCancelledDelivered: boolean;
};

export type PaginationState = {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
};

export type ExtractedDniInfo = {
  name?: string;
  surname?: string;
  dni?: string;
  birthDate?: string;
  nationality?: string;
  address?: string;
  confidence?: number;
};

export type DocumentInfo = {
  url: string | null;
  label: string;
  hasDocument: boolean;
};

export type ValidationResult = {
  isValid: boolean;
  message?: string;
};

export type FieldRules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
};

// Props types for components
export type FinancingTableProps = {
  data: FinancingData[];
  onSelectRequest: (request: FinancingData) => void;
  onDownloadDocuments: (request: FinancingData) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export type FinancingFiltersProps = {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
};

export type FinancingRowProps = {
  item: FinancingData;
  sequentialId: number;
  onView: (item: FinancingData) => void;
  onDownload: (item: FinancingData) => void;
};

export type FinancingDetailViewProps = {
  request: FinancingData;
  onBack: () => void;
};

export type PersonalInfoSectionProps = {
  request: FinancingData;
  dniInfo: ExtractedDniInfo;
  onFieldUpdate: (field: string, value: any) => void;
  showExtractedData: boolean;
  onToggleExtractedData: () => void;
};

export type DocumentsSectionProps = {
  request: FinancingData;
  onDownloadAll: () => void;
  onDownloadSingle: (url: string, name: string) => void;
};

export type AdminNotesSectionProps = {
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  isSaving: boolean;
};

export type StatusControlSectionProps = {
  status: string;
  contacted: boolean;
  onStatusChange: (status: string) => void;
  onContactedToggle: () => void;
};

export type StatusBadgeProps = {
  status: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
};

export type DocumentLinkProps = {
  url: string | null;
  label: string;
  icon?: React.ComponentType;
  onDownload?: () => void;
};