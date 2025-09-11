export enum ReportType {
  MOVEMENT = 'movement',
  FINANCIAL = 'financial',
  INVENTORY = 'inventory',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export interface ReportFilters {
  type: ReportType;
  startDate: string;
  endDate: string;
  organizationId?: string;
  literatureId?: string;
  category?: string;
}

export interface MovementReportItem {
  id: string;
  date: string;
  type: 'incoming' | 'outgoing' | 'adjustment';
  literatureId: string;
  literatureTitle: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  fromOrganization?: {
    id: string;
    name: string;
  };
  toOrganization: {
    id: string;
    name: string;
  };
  orderId?: string;
  orderNumber?: string;
  notes?: string;
}

export interface FinancialReportItem {
  period: string; // YYYY-MM format
  organizationId: string;
  organizationName: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  literatureBreakdown: {
    literatureId: string;
    literatureTitle: string;
    quantitySold: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}

export interface InventoryReportItem {
  literatureId: string;
  literatureTitle: string;
  category: string;
  unitPrice: number;
  organizations: {
    organizationId: string;
    organizationName: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    totalValue: number;
  }[];
  totalQuantity: number;
  totalValue: number;
}

export interface ReportData {
  type: ReportType;
  filters: ReportFilters;
  generatedAt: string;
  data: MovementReportItem[] | FinancialReportItem[] | InventoryReportItem[];
  summary?: {
    totalItems: number;
    totalValue?: number;
    totalQuantity?: number;
    [key: string]: any;
  };
}

export interface ExportRequest {
  reportData: ReportData;
  format: ExportFormat;
  filename?: string;
}

export interface ExportResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
}