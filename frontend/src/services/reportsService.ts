import axios from 'axios';
import {
  ReportType,
  ReportFilters,
  ReportData,
  ExportRequest,
  ExportResponse,
  ExportFormat,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ReportsService {
  private baseURL = `${API_BASE_URL}/api/reports`;

  async generateReport(filters: ReportFilters): Promise<ReportData> {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    if (filters.organizationId) {
      params.append('organizationId', filters.organizationId);
    }
    if (filters.literatureId) {
      params.append('literatureId', filters.literatureId);
    }
    if (filters.category) {
      params.append('category', filters.category);
    }

    const response = await axios.get(`${this.baseURL}/${filters.type}?${params}`);
    return response.data;
  }

  async getMovementReport(filters: Omit<ReportFilters, 'type'>): Promise<ReportData> {
    return this.generateReport({ ...filters, type: ReportType.MOVEMENT });
  }

  async getFinancialReport(filters: Omit<ReportFilters, 'type'>): Promise<ReportData> {
    return this.generateReport({ ...filters, type: ReportType.FINANCIAL });
  }

  async getInventoryReport(filters: Omit<ReportFilters, 'type'>): Promise<ReportData> {
    return this.generateReport({ ...filters, type: ReportType.INVENTORY });
  }

  async exportReport(exportRequest: ExportRequest): Promise<ExportResponse> {
    const response = await axios.post(`${this.baseURL}/export`, exportRequest, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  async downloadReport(downloadUrl: string): Promise<Blob> {
    const response = await axios.get(downloadUrl, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Вспомогательные методы для получения данных для фильтров
  async getOrganizations(): Promise<Array<{ id: string; name: string; type: string }>> {
    const response = await axios.get(`${API_BASE_URL}/api/organizations`);
    return response.data;
  }

  async getLiteratureList(): Promise<Array<{ id: string; title: string; category: string }>> {
    const response = await axios.get(`${API_BASE_URL}/api/literature`);
    return response.data.literature || response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/api/literature/categories`);
    return response.data;
  }
}

export const reportsService = new ReportsService();