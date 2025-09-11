import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {
  Drafts as DraftIcon,
  Schedule as PendingIcon,
  CheckCircle as ApprovedIcon,
  Build as AssemblyIcon,
  LocalShipping as ShippedIcon,
  Inventory as DeliveredIcon,
  TaskAlt as CompletedIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';
import { OrderStatus as OrderStatusEnum } from '@/types/orders';

interface OrderStatusProps {
  status: OrderStatusEnum;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({
  status,
  size = 'medium',
  showIcon = true,
}) => {
  const getStatusConfig = (status: OrderStatusEnum) => {
    switch (status) {
      case OrderStatusEnum.DRAFT:
        return {
          label: 'Черновик',
          color: 'default' as const,
          icon: <DraftIcon />,
          description: 'Заказ находится в стадии создания',
        };
      case OrderStatusEnum.PENDING:
        return {
          label: 'Ожидает',
          color: 'warning' as const,
          icon: <PendingIcon />,
          description: 'Заказ отправлен и ожидает обработки',
        };
      case OrderStatusEnum.APPROVED:
        return {
          label: 'Одобрен',
          color: 'info' as const,
          icon: <ApprovedIcon />,
          description: 'Заказ одобрен и готов к сборке',
        };
      case OrderStatusEnum.IN_ASSEMBLY:
        return {
          label: 'В сборке',
          color: 'primary' as const,
          icon: <AssemblyIcon />,
          description: 'Заказ находится в процессе сборки',
        };
      case OrderStatusEnum.SHIPPED:
        return {
          label: 'Отгружен',
          color: 'secondary' as const,
          icon: <ShippedIcon />,
          description: 'Заказ отгружен и находится в пути',
        };
      case OrderStatusEnum.DELIVERED:
        return {
          label: 'Доставлен',
          color: 'success' as const,
          icon: <DeliveredIcon />,
          description: 'Заказ доставлен получателю',
        };
      case OrderStatusEnum.COMPLETED:
        return {
          label: 'Завершен',
          color: 'success' as const,
          icon: <CompletedIcon />,
          description: 'Заказ полностью завершен',
        };
      case OrderStatusEnum.REJECTED:
        return {
          label: 'Отклонен',
          color: 'error' as const,
          icon: <RejectedIcon />,
          description: 'Заказ был отклонен',
        };
      default:
        return {
          label: 'Неизвестно',
          color: 'default' as const,
          icon: <DraftIcon />,
          description: 'Неизвестный статус заказа',
        };
    }
  };

  const config = getStatusConfig(status);

  const chipElement = (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      icon={showIcon ? config.icon : undefined}
      variant="filled"
      sx={{
        fontWeight: 500,
        '& .MuiChip-icon': {
          fontSize: size === 'small' ? '16px' : '18px',
        },
      }}
    />
  );

  return (
    <Tooltip title={config.description} arrow>
      {chipElement}
    </Tooltip>
  );
};

export default OrderStatus;