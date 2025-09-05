import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import {
  GradientCard,
  GradientButton,
  AnimatedContainer,
  StatusChip,
} from '../components/ui';

// Моковые данные для демонстрации
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    from: 'Группа "Надежда"',
    to: 'Местность Новосибирск',
    status: 'pending' as const,
    totalAmount: 2500,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    from: 'Местность Новосибирск',
    to: 'Регион Сибирь',
    status: 'approved' as const,
    totalAmount: 15000,
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    from: 'Подкомитет "Свобода"',
    to: 'Местность Новосибирск',
    status: 'in_assembly' as const,
    totalAmount: 3200,
    createdAt: '2024-01-13',
  },
];

export const OrdersPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Управление заказами
          </Typography>
          <GradientButton startIcon={<Add />}>
            Создать заказ
          </GradientButton>
        </Box>
      </AnimatedContainer>

      <AnimatedContainer animation="slideUp" delay={200}>
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Поиск заказов..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <GradientButton
              variant="outlined"
              fullWidth
              startIcon={<FilterList />}
              gradient="secondary"
            >
              Фильтры
            </GradientButton>
          </Grid>
        </Grid>
      </AnimatedContainer>

      <AnimatedContainer animation="slideUp" delay={300}>
        <GradientCard gradient>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Номер заказа
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      От
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Кому
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Статус
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Сумма
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Дата
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Действия
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockOrders.map((order, index) => (
                  <TableRow
                    key={order.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.colors.primary[50],
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.from}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.to}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={order.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {order.totalAmount.toLocaleString()} ₽
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {order.createdAt}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton size="small" color="primary">
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GradientCard>
      </AnimatedContainer>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
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
        <Add />
      </Fab>
    </Box>
  );
};