import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { ReportViewer } from '../ReportViewer';
import {
  ReportData,
  ReportType,
  MovementReportItem,
  FinancialReportItem,
  InventoryReportItem,
} from '@/types';
import { theme } from '@/theme';

// Мокаем UI компоненты
jest.mock('../../ui', () => ({
  AnimatedContainer: ({ children }: any) => <div>{children}</div>,
  GradientCard: ({ children }: any) => <div>{children}</div>,
}));

const mockMovementData: MovementReportItem[] = [
  {
    id: '1',
    date: '2024-01-15T10:00:00Z',
    type: 'incoming',
    literatureId: 'lit1',
    literatureTitle: 'Базовый текст АН',
    quantity: 10,
    unitPrice: 350,
    totalAmount: 3500,
    toOrganization: {
      id: 'org1',
      name: 'Региональный склад',
    },
    fromOrganization: {
      id: 'org2',
      name: 'Издательство',
    },
    orderId: 'order1',
    orderNumber: 'ORD-001',
  },
  {
    id: '2',
    date: '2024-01-16T14:30:00Z',
    type: 'outgoing',
    literatureId: 'lit1',
    literatureTitle: 'Базовый текст АН',
    quantity: 5,
    unitPrice: 350,
    totalAmount: 1750,
    toOrganization: {
      id: 'org3',
      name: 'Группа Надежда',
    },
    orderId: 'order2',
    orderNumber: 'ORD-002',
  },
];

const mockFinancialData: FinancialReportItem[] = [
  {
    period: '2024-01',
    organizationId: 'org1',
    organizationName: 'Региональный склад',
    totalIncome: 10000,
    totalExpenses: 7000,
    netProfit: 3000,
    literatureBreakdown: [
      {
        literatureId: 'lit1',
        literatureTitle: 'Базовый текст АН',
        quantitySold: 20,
        revenue: 7000,
        cost: 5000,
        profit: 2000,
      },
      {
        literatureId: 'lit2',
        literatureTitle: 'Это работает',
        quantitySold: 15,
        revenue: 3000,
        cost: 2000,
        profit: 1000,
      },
    ],
  },
];

const mockInventoryData: InventoryReportItem[] = [
  {
    literatureId: 'lit1',
    literatureTitle: 'Базовый текст АН',
    category: 'Базовая литература',
    unitPrice: 350,
    totalQuantity: 45,
    totalValue: 15750,
    organizations: [
      {
        organizationId: 'org1',
        organizationName: 'Региональный склад',
        quantity: 30,
        reservedQuantity: 5,
        availableQuantity: 25,
        totalValue: 10500,
      },
      {
        organizationId: 'org2',
        organizationName: 'Местность Центр',
        quantity: 15,
        reservedQuantity: 2,
        availableQuantity: 13,
        totalValue: 5250,
      },
    ],
  },
];

const createMockReportData = (
  type: ReportType,
  data: any[],
  summary?: any
): ReportData => ({
  type,
  filters: {
    type,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  generatedAt: '2024-01-31T12:00:00Z',
  data,
  summary: summary || {
    totalItems: data.length,
    totalValue: 15750,
    totalQuantity: 45,
  },
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ReportViewer', () => {
  it('renders movement report correctly', () => {
    const reportData = createMockReportData(ReportType.MOVEMENT, mockMovementData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText('Отчет по движению литературы')).toBeInTheDocument();
    expect(screen.getByText('Базовый текст АН')).toBeInTheDocument();
    expect(screen.getByText('Поступление')).toBeInTheDocument();
    expect(screen.getByText('Отгрузка')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
  });

  it('renders financial report correctly', () => {
    const reportData = createMockReportData(ReportType.FINANCIAL, mockFinancialData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText('Финансовый отчет')).toBeInTheDocument();
    expect(screen.getByText('Региональный склад - 2024-01')).toBeInTheDocument();
    expect(screen.getByText(/Доходы: 10 000/)).toBeInTheDocument();
    expect(screen.getByText(/Расходы: 7 000/)).toBeInTheDocument();
    expect(screen.getByText(/Прибыль: 3 000/)).toBeInTheDocument();
  });

  it('renders inventory report correctly', () => {
    const reportData = createMockReportData(ReportType.INVENTORY, mockInventoryData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText('Отчет по остаткам на складах')).toBeInTheDocument();
    expect(screen.getByText('Базовый текст АН')).toBeInTheDocument();
    expect(screen.getByText('Базовая литература')).toBeInTheDocument();
    expect(screen.getByText('Региональный склад')).toBeInTheDocument();
    expect(screen.getByText('Местность Центр')).toBeInTheDocument();
  });

  it('displays summary information', () => {
    const reportData = createMockReportData(ReportType.MOVEMENT, mockMovementData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText('Всего записей')).toBeInTheDocument();
    expect(screen.getByText('Общее количество')).toBeInTheDocument();
    expect(screen.getByText('Общая стоимость')).toBeInTheDocument();
    expect(screen.getByText('Период отчета')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    const reportData = createMockReportData(ReportType.MOVEMENT, []);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument();
    expect(screen.getByText('Попробуйте изменить параметры фильтрации или период отчета')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    const reportData = createMockReportData(ReportType.MOVEMENT, mockMovementData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    // Проверяем форматирование валюты
    expect(screen.getByText('350,00 ₽')).toBeInTheDocument();
    expect(screen.getByText('3 500,00 ₽')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    const reportData = createMockReportData(ReportType.MOVEMENT, mockMovementData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    // Проверяем форматирование дат
    expect(screen.getByText('15.01.2024 10:00')).toBeInTheDocument();
    expect(screen.getByText('16.01.2024 14:30')).toBeInTheDocument();
  });

  it('displays correct type colors for movement report', () => {
    const reportData = createMockReportData(ReportType.MOVEMENT, mockMovementData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    const incomingChip = screen.getByText('Поступление').closest('.MuiChip-root');
    const outgoingChip = screen.getByText('Отгрузка').closest('.MuiChip-root');

    expect(incomingChip).toHaveClass('MuiChip-colorSuccess');
    expect(outgoingChip).toHaveClass('MuiChip-colorError');
  });

  it('handles financial report with profit and loss', () => {
    const financialDataWithLoss: FinancialReportItem[] = [
      {
        ...mockFinancialData[0],
        totalIncome: 5000,
        totalExpenses: 7000,
        netProfit: -2000,
        literatureBreakdown: [
          {
            literatureId: 'lit1',
            literatureTitle: 'Базовый текст АН',
            quantitySold: 10,
            revenue: 3500,
            cost: 5000,
            profit: -1500,
          },
        ],
      },
    ];

    const reportData = createMockReportData(ReportType.FINANCIAL, financialDataWithLoss);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText(/Прибыль: -2 000/)).toBeInTheDocument();
  });

  it('displays organization distribution in inventory report', () => {
    const reportData = createMockReportData(ReportType.INVENTORY, mockInventoryData);
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText('Региональный склад:')).toBeInTheDocument();
    expect(screen.getByText('30 (25 доступно)')).toBeInTheDocument();
    expect(screen.getByText('Местность Центр:')).toBeInTheDocument();
    expect(screen.getByText('15 (13 доступно)')).toBeInTheDocument();
  });

  it('handles unsupported report type', () => {
    const reportData = {
      ...createMockReportData(ReportType.MOVEMENT, []),
      type: 'unsupported' as ReportType,
    };
    
    renderWithTheme(<ReportViewer reportData={reportData} />);

    expect(screen.getByText('Неподдерживаемый тип отчета: unsupported')).toBeInTheDocument();
  });
});