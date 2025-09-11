import React from 'react';
import { Chip, ChipProps, styled, alpha } from '@mui/material';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: 'draft' | 'pending' | 'approved' | 'in_assembly' | 'shipped' | 'delivered' | 'completed' | 'rejected';
}

const statusConfig = {
  draft: {
    color: '#757575',
    background: '#f5f5f5',
    label: 'Черновик',
  },
  pending: {
    color: '#ff9800',
    background: '#fff3e0',
    label: 'Ожидает',
  },
  approved: {
    color: '#2196f3',
    background: '#e3f2fd',
    label: 'Одобрен',
  },
  in_assembly: {
    color: '#9c27b0',
    background: '#f3e5f5',
    label: 'В сборке',
  },
  shipped: {
    color: '#3f51b5',
    background: '#e8eaf6',
    label: 'Отгружен',
  },
  delivered: {
    color: '#4caf50',
    background: '#e8f5e8',
    label: 'Доставлен',
  },
  completed: {
    color: '#388e3c',
    background: '#e8f5e8',
    label: 'Завершен',
  },
  rejected: {
    color: '#f44336',
    background: '#ffebee',
    label: 'Отклонен',
  },
};

const StyledStatusChip = styled(Chip)<{ statusColor: string; statusBackground: string }>(
  ({ statusColor, statusBackground }) => ({
    backgroundColor: statusBackground,
    color: statusColor,
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 28,
    borderRadius: 14,
    border: `1px solid ${alpha(statusColor, 0.2)}`,
    '& .MuiChip-label': {
      padding: '0 12px',
    },
  })
);

export const StatusChip: React.FC<StatusChipProps> = ({ status, ...props }) => {
  const config = statusConfig[status];

  return (
    <StyledStatusChip
      label={config.label}
      statusColor={config.color}
      statusBackground={config.background}
      {...props}
    />
  );
};