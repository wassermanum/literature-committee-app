import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  Grid,
  Paper,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { OrderFilters as OrderFiltersType, OrderStatus } from '@/types/orders';
import { OrderStatus as OrderStatusComponent } from './OrderStatus';

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFiltersChange: (filters: OrderFiltersType) => void;
  onClearFilters: () => void;
  organizations?: Array<{ id: string; name: string }>;
}

const statusOptions = [
  OrderStatus.DRAFT,
  OrderStatus.PENDING,
  OrderStatus.APPROVED,
  OrderStatus.IN_ASSEMBLY,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.REJECTED,
];

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  organizations = [],
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleFilterChange = (key: keyof OrderFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleStatusChange = (event: any) => {
    const value = event.target.value;
    handleFilterChange('status', typeof value === 'string' ? value.split(',') : value);
  };

  const hasActiveFilters = () => {
    return (
      filters.status?.length ||
      filters.search ||
      filters.fromDate ||
      filters.toDate ||
      filters.fromOrganizationId ||
      filters.toOrganizationId
    );
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          <Typography variant="h6">Фильтры</Typography>
          {hasActiveFilters() && (
            <Chip
              label={`Активных: ${[
                filters.status?.length || 0,
                filters.search ? 1 : 0,
                filters.fromDate ? 1 : 0,
                filters.toDate ? 1 : 0,
                filters.fromOrganizationId ? 1 : 0,
                filters.toOrganizationId ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}`}
              size="small"
              color="primary"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasActiveFilters() && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={onClearFilters}
            >
              Очистить
            </Button>
          )}
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Быстрые фильтры */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Поиск по номеру заказа..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            multiple
            value={filters.status || []}
            onChange={handleStatusChange}
            input={<OutlinedInput label="Статус" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as OrderStatus[]).map((value) => (
                  <OrderStatusComponent
                    key={value}
                    status={value}
                    size="small"
                    showIcon={false}
                  />
                ))}
              </Box>
            )}
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                <OrderStatusComponent status={status} size="small" />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Расширенные фильтры */}
      <Collapse in={expanded}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Дата от"
                value={filters.fromDate ? new Date(filters.fromDate) : null}
                onChange={(date) => handleFilterChange('fromDate', date?.toISOString().split('T')[0])}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Дата до"
                value={filters.toDate ? new Date(filters.toDate) : null}
                onChange={(date) => handleFilterChange('toDate', date?.toISOString().split('T')[0])}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Заказчик</InputLabel>
                <Select
                  value={filters.fromOrganizationId || ''}
                  onChange={(e) => handleFilterChange('fromOrganizationId', e.target.value)}
                  label="Заказчик"
                >
                  <MenuItem value="">
                    <em>Все</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Получатель</InputLabel>
                <Select
                  value={filters.toOrganizationId || ''}
                  onChange={(e) => handleFilterChange('toOrganizationId', e.target.value)}
                  label="Получатель"
                >
                  <MenuItem value="">
                    <em>Все</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Collapse>
    </Paper>
  );
};

export default OrderFilters;