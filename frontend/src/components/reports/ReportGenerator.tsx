import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  GetApp,
  PictureAsPdf,
  TableChart,
  Assessment,
  Refresh,
} from '@mui/icons-material';
import { format, subMonths } from 'date-fns';
import {
  ReportType,
  ReportFilters,
  // ReportData, // Unused import
  ExportFormat,
} from '@/types';
import { useReports, useReportFilters } from '@/hooks/useReports';
import { AnimatedContainer, GradientButton } from '@/components/ui';
import { ReportFilters as FiltersComponent } from './ReportFilters';
import { ReportViewer } from './ReportViewer';

export const ReportGenerator: React.FC = () => {
  const {
    reportData,
    loading,
    error,
    exporting,
    generateReport,
    exportReport,
    clearReport,
  } = useReports();

  const {
    organizations,
    literature,
    categories,
    loading: filtersLoading,
    error: filtersError,
    loadFilterData,
  } = useReportFilters();

  const [filters, setFilters] = useState<ReportFilters>({
    type: ReportType.MOVEMENT,
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  const handleGenerateReport = async () => {
    try {
      await generateReport(filters);
    } catch (err) {
      // Ошибка уже обработана в хуке
    }
  };

  const handleExportReport = async (format: ExportFormat) => {
    if (!reportData) return;

    try {
      const filename = `${getReportTypeLabel(reportData.type)}_${format(
        new Date(reportData.filters.startDate),
        'yyyy-MM-dd'
      )}_${format(new Date(reportData.filters.endDate), 'yyyy-MM-dd')}.${format.toLowerCase()}`;

      await exportReport(reportData, format, filename);
    } catch (err) {
      // Ошибка уже обработана в хуке
    }
  };

  const getReportTypeLabel = (type: ReportType) => {
    switch (type) {
      case ReportType.MOVEMENT:
        return 'Движение_литературы';
      case ReportType.FINANCIAL:
        return 'Финансовый_отчет';
      case ReportType.INVENTORY:
        return 'Остатки_на_складах';
      default:
        return 'Отчет';
    }
  };

  const canGenerate = filters.type && filters.startDate && filters.endDate;

  return (
    <Box>
      {/* Заголовок */}
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Генератор отчетов
          </Typography>
          {reportData && (
            <Button
              startIcon={<Refresh />}
              onClick={clearReport}
              variant="outlined"
            >
              Новый отчет
            </Button>
          )}
        </Box>
      </AnimatedContainer>

      {/* Ошибки */}
      {(error || filtersError) && (
        <AnimatedContainer animation="slideUp" delay={150}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || filtersError}
          </Alert>
        </AnimatedContainer>
      )}

      {/* Фильтры */}
      {!reportData && (
        <AnimatedContainer animation="slideUp" delay={200}>
          <FiltersComponent
            filters={filters}
            organizations={organizations}
            literature={literature}
            categories={categories}
            onFiltersChange={setFilters}
            loading={filtersLoading}
          />
        </AnimatedContainer>
      )}

      {/* Кнопка генерации */}
      {!reportData && (
        <AnimatedContainer animation="slideUp" delay={300}>
          <Box display="flex" justifyContent="center" mb={4}>
            <GradientButton
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
              onClick={handleGenerateReport}
              disabled={!canGenerate || loading || filtersLoading}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Генерация...' : 'Сформировать отчет'}
            </GradientButton>
          </Box>
        </AnimatedContainer>
      )}

      {/* Отчет */}
      {reportData && (
        <>
          {/* Панель экспорта */}
          <AnimatedContainer animation="slideUp" delay={100}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  Экспорт отчета
                </Typography>
                <Box display="flex" gap={2}>
                  <Button
                    startIcon={exporting ? <CircularProgress size={16} /> : <PictureAsPdf />}
                    onClick={() => handleExportReport(ExportFormat.PDF)}
                    disabled={exporting}
                    variant="outlined"
                    color="error"
                  >
                    PDF
                  </Button>
                  <Button
                    startIcon={exporting ? <CircularProgress size={16} /> : <TableChart />}
                    onClick={() => handleExportReport(ExportFormat.EXCEL)}
                    disabled={exporting}
                    variant="outlined"
                    color="success"
                  >
                    Excel
                  </Button>
                  <Button
                    startIcon={exporting ? <CircularProgress size={16} /> : <GetApp />}
                    onClick={() => handleExportReport(ExportFormat.CSV)}
                    disabled={exporting}
                    variant="outlined"
                  >
                    CSV
                  </Button>
                </Box>
              </Box>
            </Paper>
          </AnimatedContainer>

          <Divider sx={{ mb: 4 }} />

          {/* Просмотр отчета */}
          <ReportViewer reportData={reportData} />
        </>
      )}
    </Box>
  );
};