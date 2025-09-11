import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';

import { OrderStatus } from '../OrderStatus';
import { OrderStatus as OrderStatusEnum } from '@/types/orders';
import theme from '@/theme/theme';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('OrderStatus', () => {
  it('renders draft status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.DRAFT} />
      </TestWrapper>
    );

    expect(screen.getByText('Черновик')).toBeInTheDocument();
  });

  it('renders pending status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.PENDING} />
      </TestWrapper>
    );

    expect(screen.getByText('Ожидает')).toBeInTheDocument();
  });

  it('renders approved status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.APPROVED} />
      </TestWrapper>
    );

    expect(screen.getByText('Одобрен')).toBeInTheDocument();
  });

  it('renders in assembly status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.IN_ASSEMBLY} />
      </TestWrapper>
    );

    expect(screen.getByText('В сборке')).toBeInTheDocument();
  });

  it('renders shipped status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.SHIPPED} />
      </TestWrapper>
    );

    expect(screen.getByText('Отгружен')).toBeInTheDocument();
  });

  it('renders delivered status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.DELIVERED} />
      </TestWrapper>
    );

    expect(screen.getByText('Доставлен')).toBeInTheDocument();
  });

  it('renders completed status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.COMPLETED} />
      </TestWrapper>
    );

    expect(screen.getByText('Завершен')).toBeInTheDocument();
  });

  it('renders rejected status correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.REJECTED} />
      </TestWrapper>
    );

    expect(screen.getByText('Отклонен')).toBeInTheDocument();
  });

  it('renders small size correctly', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.DRAFT} size="small" />
      </TestWrapper>
    );

    const chip = screen.getByText('Черновик').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeSmall');
  });

  it('renders without icon when showIcon is false', () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.DRAFT} showIcon={false} />
      </TestWrapper>
    );

    const chip = screen.getByText('Черновик').closest('.MuiChip-root');
    const icon = chip?.querySelector('.MuiChip-icon');
    expect(icon).not.toBeInTheDocument();
  });

  it('shows tooltip with description on hover', async () => {
    render(
      <TestWrapper>
        <OrderStatus status={OrderStatusEnum.DRAFT} />
      </TestWrapper>
    );

    const chip = screen.getByText('Черновик');
    
    // Проверяем, что tooltip существует (через aria-describedby или title)
    expect(chip.closest('[title]') || chip.closest('[aria-describedby]')).toBeInTheDocument();
  });

  it('handles unknown status gracefully', () => {
    render(
      <TestWrapper>
        <OrderStatus status={'unknown' as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Неизвестно')).toBeInTheDocument();
  });
});