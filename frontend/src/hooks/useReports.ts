import { useState, useCallback } from 'react';
import {
  ReportType,
  ReportFilters,
  ReportData,
  ExportRequest,
  ExportFormat,
} from '@/types';
import { reportsService } from '@/services';

export const useReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const generateReport = useCallback(async (filters: ReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.generateReport(filters);
      setReportData(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка генерации отчета';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (
    reportData: ReportData,
    format: ExportFormat,
    filename?: string
  ) => {
    try {
      setExporting(true);
      setError(null);

      const exportRequest: ExportRequest = {
        reportData,
        format,
        filename,
      };

      const exportResponse = await reportsService.exportReport(exportRequest);
      
      // Скачиваем файл
      const blob = await reportsService.downloadReport(exportResponse.downloadUrl);
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportResponse.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return exportResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка экспорта отчета';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setExporting(false);
    }
  }, []);

  const clearReport = useCallback(() => {
    setReportData(null);
    setError(null);
  }, []);

  return {
    reportData,
    loading,
    error,
    exporting,
    generateReport,
    exportReport,
    clearReport,
  };
};

export const useReportFilters = () => {
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [literature, setLiterature] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgsData, litData, catsData] = await Promise.all([
        reportsService.getOrganizations(),
        reportsService.getLiteratureList(),
        reportsService.getCategories(),
      ]);

      setOrganizations(orgsData);
      setLiterature(litData);
      setCategories(catsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных для фильтров';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    organizations,
    literature,
    categories,
    loading,
    error,
    loadFilterData,
  };
};