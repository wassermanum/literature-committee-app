import React, { useState } from 'react';
import {
  Box,
  Typography,
  Fab,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ShoppingCart as OrdersIcon,
} from '@mui/icons-material';
import { AnimatedContainer, GradientButton } from '@/components/ui';
import {
  OrderList,
  OrderForm,
  OrderDetails,
  OrderFilters,
} from '@/components/orders';
import {
  useOrders,
  useAvailableOrganizations,
  useLiteratureForOrder,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useUpdateOrderStatus,
  useLockOrder,
  useUnlockOrder,
} from '@/hooks/useOrders';
import {
  Order,
  OrderFilters as OrderFiltersType,
  OrderStatus,
  CreateOrderRequest,
  UpdateOrderRequest,
} from '@/types/orders';

export const OrdersPage: React.FC = () => {
  const theme = useTheme();
  
  // Состояние для фильтров и пагинации
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  
  // Состояние для диалогов
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Хуки для данных
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useOrders(filters, page + 1, limit);
  const { data: organizations = [] } = useAvailableOrganizations();
  const { data: literature = [] } = useLiteratureForOrder();

  // Хуки для мутаций
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const lockOrderMutation = useLockOrder();
  const unlockOrderMutation = useUnlockOrder();

  // Обработчики событий
  const handleCreateOrder = () => {
    setCreateDialogOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleChangeStatus = (order: Order, status: OrderStatus) => {
    updateStatusMutation.mutate({ id: order.id, status });
  };

  const handleLockOrder = (order: Order) => {
    lockOrderMutation.mutate(order.id);
  };

  const handleUnlockOrder = (order: Order) => {
    unlockOrderMutation.mutate(order.id);
  };

  const handleCreateSubmit = (data: CreateOrderRequest) => {
    createOrderMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  const handleUpdateSubmit = (data: UpdateOrderRequest) => {
    if (selectedOrder) {
      updateOrderMutation.mutate(
        { id: selectedOrder.id, data },
        {
          onSuccess: () => {
            setEditDialogOpen(false);
            setSelectedOrder(null);
          },
        }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedOrder) {
      deleteOrderMutation.mutate(selectedOrder.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedOrder(null);
        },
      });
    }
  };

  const handleFiltersChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters);
    setPage(0); // Сбрасываем на первую страницу при изменении фильтров
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  return (
    <Box>
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <OrdersIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={600} color="text.primary">
              Управление заказами
            </Typography>
          </Box>
          <GradientButton startIcon={<AddIcon />} onClick={handleCreateOrder}>
            Создать заказ
          </GradientButton>
        </Box>
      </AnimatedContainer>

      {/* Фильтры */}
      <AnimatedContainer animation="slideUp" delay={200}>
        <OrderFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          organizations={organizations}
        />
      </AnimatedContainer>

      {/* Ошибка загрузки */}
      {ordersError && (
        <AnimatedContainer animation="slideUp" delay={300}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Ошибка при загрузке заказов: {(ordersError as any)?.message || 'Неизвестная ошибка'}
          </Alert>
        </AnimatedContainer>
      )}

      {/* Список заказов */}
      <AnimatedContainer animation="slideUp" delay={300}>
        <OrderList
          orders={ordersData?.orders || []}
          loading={ordersLoading}
          total={ordersData?.total || 0}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onViewOrder={handleViewOrder}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onChangeStatus={handleChangeStatus}
          onLockOrder={handleLockOrder}
          onUnlockOrder={handleUnlockOrder}
        />
      </AnimatedContainer>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add order"
        onClick={handleCreateOrder}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: theme.colors.gradients.primary,
          '&:hover': {
            background: theme.colors.gradients.primary,
            filter: 'brightness(1.1)',
          },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Диалог создания заказа */}
      <OrderForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        organizations={organizations}
        literature={literature}
        loading={createOrderMutation.isPending}
        mode="create"
      />

      {/* Диалог редактирования заказа */}
      <OrderForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleUpdateSubmit}
        order={selectedOrder}
        organizations={organizations}
        literature={literature}
        loading={updateOrderMutation.isPending}
        mode="edit"
      />

      {/* Диалог просмотра заказа */}
      <OrderDetails
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedOrder(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить заказ № {selectedOrder?.orderNumber}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedOrder(null);
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteOrderMutation.isPending}
          >
            {deleteOrderMutation.isPending ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};