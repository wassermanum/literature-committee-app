import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Notes as NotesIcon,
  Schedule as ScheduleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Order } from '@/types/orders';
import { OrderStatus } from './OrderStatus';

interface OrderDetailsProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  open,
  onClose,
  order,
}) => {
  if (!order) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ViewIcon />
          Заказ № {order.orderNumber}
          <OrderStatus status={order.status} />
          {!order.isEditable && (
            <Chip
              icon={<LockIcon />}
              label="Заблокирован"
              size="small"
              color="warning"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Основная информация */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon />
                    Заказчик
                  </Typography>
                  <Box sx={{ ml: 4 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {order.fromOrganization?.name || 'Неизвестно'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <PersonIcon fontSize="small" />
                      {order.fromOrganization?.contactPerson}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" />
                      {order.fromOrganization?.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      {order.fromOrganization?.email}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon />
                    Получатель
                  </Typography>
                  <Box sx={{ ml: 4 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {order.toOrganization?.name || 'Неизвестно'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <PersonIcon fontSize="small" />
                      {order.toOrganization?.contactPerson}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" />
                      {order.toOrganization?.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      {order.toOrganization?.email}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Информация о заказе */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Информация о заказе
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Дата создания
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    {formatDate(order.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Дата обновления
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    {formatDate(order.updatedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Общая сумма
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(order.totalAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Позиций в заказе
                  </Typography>
                  <Typography variant="h6">
                    {order.items.length}
                  </Typography>
                </Grid>
              </Grid>

              {order.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotesIcon fontSize="small" />
                    Примечания
                  </Typography>
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {order.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {order.lockedAt && order.lockedBy && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon fontSize="small" />
                    Информация о блокировке
                  </Typography>
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'warning.50' }}>
                    <Typography variant="body2">
                      Заблокирован {formatDate(order.lockedAt)} пользователем {order.lockedBy}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>

          <Divider />

          {/* Позиции заказа */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Позиции заказа
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Литература</TableCell>
                    <TableCell>Описание</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell align="right">Цена за ед.</TableCell>
                    <TableCell align="right">Количество</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.literature?.title || 'Неизвестно'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.literature?.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.literature?.category || 'Без категории'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(item.unitPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.totalPrice)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      <Typography variant="h6">
                        Итого:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetails;