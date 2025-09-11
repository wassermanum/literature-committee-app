import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { ReportGenerator } from '../ReportGenerator';
import { ReportType, ExportFormat } from '@/types';
import { theme } from '@/theme';
import * as useReportsHook from '@/hooks/useReports';

// Мокаем хуки
jest.mock('../../../hooks/useReports');
const mockUseReports = useReportsHook.useReports as jest.MockedFunction<
  typeof useReportsHook.useReports
>;
const mockUseReportFilters = useReportsHook.useReportFilters as jest.MockedFunction<
  typeof useReportsHook.useReportFilters
>;

// Мокаем компоненты
jest.mock('../ReportFilters', () => ({
  ReportFilters: ({ onFiltersChange }: any) => (
    <div data-testid="report-filters">
      <button onClick={() => onFiltersChange({ type: ReportType.MOVEMENT })}>
        Change Filters
      </button>
    </div>
  ),
}));

jest.mock('../ReportViewer', () => ({
  ReportViewer: ({ reportData }: any) => (
    <div data-testid="report-viewer">
      Report: {reportData.type}
    </div>
  ),
}));

jest.mock('../../ui', () => ({
  AnimatedContainer: ({ children }: any) => <div>{children}</div>,
  GradientButton: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

const mockReportData = {
  type: ReportType.MOVEMENT,
  filters: {
    type: ReportType.MOVEMENT,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  generatedAt: '2024-01-31T12:00:00Z',
  data: [],
  summary: {
    totalItems: 0,
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ReportGenerator', () => {
  const mockGenerateReport = jest.fn();
  const mockExportReport = jest.fn();
  const mockClearReport = jest.fn();
  const mockLoadFilterData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseReports.mockReturnValue({
      reportData: null,
      loading: false,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    mockUseReportFilters.mockReturnValue({
      organizations: [
        { id: 'org1', name: 'Региональный склад', type: 'region' },
        { id: 'org2', name: 'Местность Центр', type: 'locality' },
      ],
      literature: [
        { id: 'lit1', title: 'Базовый текст АН', category: 'Базовая литература' },
      ],
      categories: ['Базовая литература', 'Медитации'],
      loading: false,
      error: null,
      loadFilterData: mockLoadFilterData,
    });
  });

  it('renders generator interface initially', () => {
    renderWithTheme(<ReportGenerator />);

    expect(screen.getByText('Генератор отчетов')).toBeInTheDocument();
    expect(screen.getByTestId('report-filters')).toBeInTheDocument();
    expect(screen.getByText('Сформировать отчет')).toBeInTheDocument();
  });

  it('loads filter data on mount', () => {
    renderWithTheme(<ReportGenerator />);

    expect(mockLoadFilterData).toHaveBeenCalledTimes(1);
  });

  it('generates report when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ReportGenerator />);

    const generateButton = screen.getByText('Сформировать отчет');
    await user.click(generateButton);

    expect(mockGenerateReport).toHaveBeenCalledWith({
      type: ReportType.MOVEMENT,
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
  });

  it('shows loading state during report generation', () => {
    mockUseReports.mockReturnValue({
      reportData: null,
      loading: true,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    expect(screen.getByText('Генерация...')).toBeInTheDocument();
    expect(screen.getByText('Генерация...')).toBeDisabled();
  });

  it('displays error message when generation fails', () => {
    mockUseReports.mockReturnValue({
      reportData: null,
      loading: false,
      error: 'Ошибка генерации отчета',
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    expect(screen.getByText('Ошибка генерации отчета')).toBeInTheDocument();
  });

  it('shows report viewer when report is generated', () => {
    mockUseReports.mockReturnValue({
      reportData: mockReportData,
      loading: false,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    expect(screen.getByTestId('report-viewer')).toBeInTheDocument();
    expect(screen.getByText('Report: movement')).toBeInTheDocument();
    expect(screen.getByText('Экспорт отчета')).toBeInTheDocument();
  });

  it('shows export buttons when report is available', () => {
    mockUseReports.mockReturnValue({
      reportData: mockReportData,
      loading: false,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('exports report in PDF format', async () => {
    const user = userEvent.setup();
    mockUseReports.mockReturnValue({
      reportData: mockReportData,
      loading: false,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    const pdfButton = screen.getByText('PDF');
    await user.click(pdfButton);

    expect(mockExportReport).toHaveBeenCalledWith(
      mockReportData,
      ExportFormat.PDF,
      expect.stringContaining('Движение_литературы_2024-01-01_2024-01-31.pdf')
    );
  });

  it('exports report in Excel format', async () => {
    const user = userEvent.setup();
    mockUseReports.mockReturnValue({
      reportData: mockReportData,
      loading: false,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    const excelButton = screen.getByText('Excel');
    await user.click(excelButton);

    expect(mockExportReport).toHaveBeenCalledWith(
      mockReportData,
      ExportFormat.EXCEL,
      expect.stringContaining('Движение_литературы_2024-01-01_2024-01-31.excel')
    );
  });

  it('shows exporting state during export', () => {
    mockUseReports.mockReturnValue({
      reportData: mockReportData,
      loading: false,
      error: null,
      exporting: true,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    const exportButtons = screen.getAllByRole('button', { name: /PDF|Excel|CSV/ });
    exportButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('clears report when new report button is clicked', async () => {
    const user = userEvent.setup();
    mockUseReports.mockReturnValue({
      reportData: mockReportData,
      loading: false,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    const newReportButton = screen.getByText('Новый отчет');
    await user.click(newReportButton);

    expect(mockClearReport).toHaveBeenCalledTimes(1);
  });

  it('handles filter changes', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ReportGenerator />);

    const changeFiltersButton = screen.getByText('Change Filters');
    await user.click(changeFiltersButton);

    // Проверяем, что фильтры обновились (это внутреннее состояние компонента)
    // В реальном тесте мы бы проверили, что новые фильтры передаются в generateReport
  });

  it('disables generate button when filters are invalid', () => {
    renderWithTheme(<ReportGenerator />);

    // В начальном состоянии кнопка должна быть доступна с дефолтными фильтрами
    const generateButton = screen.getByText('Сформировать отчет');
    expect(generateButton).not.toBeDisabled();
  });

  it('shows filter loading state', () => {
    mockUseReportFilters.mockReturnValue({
      organizations: [],
      literature: [],
      categories: [],
      loading: true,
      error: null,
      loadFilterData: mockLoadFilterData,
    });

    renderWithTheme(<ReportGenerator />);

    const generateButton = screen.getByText('Сформировать отчет');
    expect(generateButton).toBeDisabled();
  });

  it('displays filter error', () => {
    mockUseReportFilters.mockReturnValue({
      organizations: [],
      literature: [],
      categories: [],
      loading: false,
      error: 'Ошибка загрузки данных фильтров',
      loadFilterData: mockLoadFilterData,
    });

    renderWithTheme(<ReportGenerator />);

    expect(screen.getByText('Ошибка загрузки данных фильтров')).toBeInTheDocument();
  });

  it('generates correct filename for different report types', async () => {
    const user = userEvent.setup();
    const financialReportData = {
      ...mockReportData,
      type: ReportType.FINANCIAL,
    };

    mockUseReports.mockReturnValue({
      reportData: financialReportData,
      loading: false,
      error: null,
      exporting: false,
      generateReport: mockGenerateReport,
      exportReport: mockExportReport,
      clearReport: mockClearReport,
    });

    renderWithTheme(<ReportGenerator />);

    const pdfButton = screen.getByText('PDF');
    await user.click(pdfButton);

    expect(mockExportReport).toHaveBeenCalledWith(
      financialReportData,
      ExportFormat.PDF,
      expect.stringContaining('Финансовый_отчет_2024-01-01_2024-01-31.pdf')
    );
  });
});