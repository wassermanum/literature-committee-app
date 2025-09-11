import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { Order, CreateOrderRequest, UpdateOrderRequest, Literature, Organization } from '@/types/orders';
import { GradientButton } from '@/components/ui/GradientButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface OrderFormData {
  toOrganizationId: string;
  notes: string;
  items: Array<{
    literatureId: string;
    quantity: number;
  }>;
}

const orderSchema = yup.object({
  toOrganizationId: yup.string().required('Выберите получателя'),
  notes: yup.string(),
  items: yup.array().of(
    yup.object({
      literatureId: yup.string().required('Выберите литературу'),
      quantity: yup.number()
        .min(1, 'Количество должно быть больше 0')
        .required('Укажите количество'),
    })
  ).min(1, 'Добавьте хотя бы одну позицию'),
});

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrderRequest | UpdateOrderRequest) => void;
  order?: Order | null;
  organizations: Organization[];
  literature: Literature[];
  loading?: boolean;
  mode: 'create' | 'edit';
}

export const OrderForm: React.FC<OrderFormProps> = ({
  open,
  onClose,
  onSubmit,
  order,
  organizations,
  literature,
  loading = false,
  mode,
}) => {
  const [totalAmount, setTotalAmount] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: yupResolver(orderSchema) as any,
    defaultValues: {
      toOrganizationId: '',
      notes: '',
      items: [{ literatureId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  // Обновляем форму при изменении заказа
  useEffect(() => {
    if (order && mode === 'edit') {
      reset({
        toOrganizationId: order.toOrganizationId,
        notes: order.notes || '',
        items: order.items.map(item => ({
          literatureId: item.literatureId,
          quantity: item.quantity,
        })),
      });
    } else if (mode === 'create') {
      reset({
        toOrganizationId: '',
        notes: '',
        items: [{ literatureId: '', quantity: 1 }],
      });
    }
  }, [order, mode, reset]);

  // Пересчитываем общую сумму при изменении позиций
  useEffect(() => {
    const total = watchedItems.reduce((sum, item) => {
      const lit = literature.find(l => l.id === item.literatureId);
      return sum + (lit ? lit.price * item.quantity : 0);
    }, 0);
    setTotalAmount(total);
  }, [watchedItems, literature]);

  const handleFormSubmit = (data: OrderFormData) => {
    if (mode === 'create') {
      onSubmit(data as CreateOrderRequest);
    } else {
      onSubmit({
        notes: data.notes,
        items: data.items.map(item => ({
          literatureId: item.literatureId,
          quantity: item.quantity,
        })),
      } as UpdateOrderRequest);
    }
  };

  const addItem = () => {
    append({ literatureId: '', quantity: 1 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getLiteraturePrice = (literatureId: string): number => {
    const lit = literature.find(l => l.id === literatureId);
    return lit ? lit.price : 0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CartIcon />
          {mode === 'create' ? 'Создание заказа' : 'Редактирование заказа'}
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit as any)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Основная информация */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Основная информация
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Controller
                  name="toOrganizationId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.toOrganizationId}>
                      <InputLabel>Получатель *</InputLabel>
                      <Select
                        {...field}
                        label="Получатель *"
                        disabled={mode === 'edit'}
                      >
                        {organizations.map((org) => (
                          <MenuItem key={org.id} value={org.id}>
                            {org.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.toOrganizationId && (
                        <Typography variant="caption" color="error">
                          {errors.toOrganizationId.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Примечания"
                      multiline
                      rows={3}
                      fullWidth
                    />
                  )}
                />
              </Box>
            </Box>

            <Divider />

            {/* Позиции заказа */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Позиции заказа
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  variant="outlined"
                  size="small"
                >
                  Добавить позицию
                </Button>
              </Box>

              {errors.items && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.items.message}
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Литература *</TableCell>
                      <TableCell width={120}>Количество *</TableCell>
                      <TableCell width={120}>Цена за ед.</TableCell>
                      <TableCell width={120}>Сумма</TableCell>
                      <TableCell width={60}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            name={`items.${index}.literatureId`}
                            control={control}
                            render={({ field: literatureField }) => (
                              <FormControl fullWidth size="small" error={!!errors.items?.[index]?.literatureId}>
                                <Select
                                  {...literatureField}
                                  displayEmpty
                                >
                                  <MenuItem value="">
                                    <em>Выберите литературу</em>
                                  </MenuItem>
                                  {literature.map((lit) => (
                                    <MenuItem key={lit.id} value={lit.id}>
                                      {lit.title}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field: quantityField }) => (
                              <TextField
                                {...quantityField}
                                type="number"
                                size="small"
                                fullWidth
                                inputProps={{ min: 1 }}
                                error={!!errors.items?.[index]?.quantity}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(getLiteraturePrice(watchedItems[index]?.literatureId || ''))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(
                              getLiteraturePrice(watchedItems[index]?.literatureId || '') * 
                              (watchedItems[index]?.quantity || 0)
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => removeItem(index)}
                            disabled={fields.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Итого */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Paper sx={{ p: 2, minWidth: 200 }}>
                  <Typography variant="h6" align="right">
                    Итого: {formatCurrency(totalAmount)}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={isSubmitting || loading}>
            Отмена
          </Button>
          <GradientButton
            type="submit"
            disabled={isSubmitting || loading}
            startIcon={loading ? <LoadingSpinner size={20} /> : undefined}
          >
            {loading ? 'Сохранение...' : mode === 'create' ? 'Создать заказ' : 'Сохранить изменения'}
          </GradientButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OrderForm;