import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Assignment as StatusIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Order, OrderStatus as OrderStatusEnum } from '@/types/orders';
import { OrderStatus } from './OrderStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
// import { UserRole } from '@/types/auth'; // Unused import

interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onChangeStatus: (order: Order, status: OrderStatusEnum) => void;
  onLockOrder: (order: Order) => void;
  onUnlockOrder: (order: Order) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  loading = false,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onChangeStatus,
  onLockOrder,
  onUnlockOrder,
}) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleStatusChange = (status: OrderStatusEnum) => {
    if (selectedOrder) {
      onChangeStatus(selectedOrder, status);
    }
    handleMenuClose();
  };

  const canEditOrder = (order: Order): boolean => {
    if (!user) return false;
    
    // Проверяем, может ли пользователь редактировать заказ
    const isOwner = order.fromOrganizationId === user.organizationId;
    const isReceiver = order.toOrganizationId === user.organizationId;
    
    return (isOwner || isReceiver) && order.isEditable;
  };

  const canChangeStatus = (order: Order): boolean => {
    if (!user) return false;
    
    // Только получатель может изменять статус заказа
    return order.toOrganizationId === user.organizationId;
  };

  const canLockUnlock = (order: Order): boolean => {
    if (!user) return false;
    
    // Только получатель может блокировать/разблокировать заказ
    return order.toOrganizationId === user.organizationId;
  };

  const getAvailableStatuses = (currentStatus: OrderStatusEnum): OrderStatusEnum[] => {
    switch (currentStatus) {
      case OrderStatusEnum.DRAFT:
        return [OrderStatusEnum.PENDING, OrderStatusEnum.REJECTED];
      case OrderStatusEnum.PENDING:
        return [OrderStatusEnum.APPROVED, OrderStatusEnum.REJECTED];
      case OrderStatusEnum.APPROVED:
        return [OrderStatusEnum.IN_ASSEMBLY, OrderStatusEnum.REJECTED];
      case OrderStatusEnum.IN_ASSEMBLY:
        return [OrderStatusEnum.SHIPPED, OrderStatusEnum.APPROVED];
      case OrderStatusEnum.SHIPPED:
        return [OrderStatusEnum.DELIVERED];
      case OrderStatusEnum.DELIVERED:
        return [OrderStatusEnum.COMPLETED];
      default:
        return [];
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <LoadingSpinner size={60} />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>№ Заказа</TableCell>
              <TableCell>От</TableCell>
              <TableCell>Кому</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Сумма</TableCell>
              <TableCell>Дата создания</TableCell>
              <TableCell>Позиций</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    Заказы не найдены
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  onClick={() => onViewOrder(order)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {order.orderNumber}
                      </Typography>
                      {!order.isEditable && (
                        <Tooltip title="Заказ заблокирован для редактирования">
                          <LockIcon fontSize="small" color="action" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.fromOrganization?.name || 'Неизвестно'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.toOrganization?.name || 'Неизвестно'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <OrderStatus status={order.status} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(order.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.items.length}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, order)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="Строк на странице:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`
        }
      />

      {/* Контекстное меню */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 },
        }}
      >
        <MenuItem onClick={() => {
          if (selectedOrder) onViewOrder(selectedOrder);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Просмотр</ListItemText>
        </MenuItem>

        {selectedOrder && canEditOrder(selectedOrder) && (
          <MenuItem onClick={() => {
            if (selectedOrder) onEditOrder(selectedOrder);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Редактировать</ListItemText>
          </MenuItem>
        )}

        {selectedOrder && canChangeStatus(selectedOrder) && (
          <>
            <Divider />
            <MenuItem disabled>
              <ListItemIcon>
                <StatusIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Изменить статус</ListItemText>
            </MenuItem>
            {getAvailableStatuses(selectedOrder.status).map((status) => (
              <MenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                sx={{ pl: 4 }}
              >
                <OrderStatus status={status} size="small" showIcon={false} />
              </MenuItem>
            ))}
          </>
        )}

        {selectedOrder && canLockUnlock(selectedOrder) && (
          <>
            <Divider />
            {selectedOrder.isEditable ? (
              <MenuItem onClick={() => {
                if (selectedOrder) onLockOrder(selectedOrder);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <LockIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Заблокировать</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem onClick={() => {
                if (selectedOrder) onUnlockOrder(selectedOrder);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <UnlockIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Разблокировать</ListItemText>
              </MenuItem>
            )}
          </>
        )}

        {selectedOrder && canEditOrder(selectedOrder) && selectedOrder.status === OrderStatusEnum.DRAFT && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                if (selectedOrder) onDeleteOrder(selectedOrder);
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Удалить</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
};

export default OrderList;