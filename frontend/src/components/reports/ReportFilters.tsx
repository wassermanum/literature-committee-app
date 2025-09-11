import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  // TextField, // Unused import
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  // ExpandMore, // Unused import
  // ExpandLess, // Unused import
  FilterList,
  // Clear, // Unused import
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ReportType, ReportFilters as FiltersType } from '@/types';

interface ReportFiltersProps {
  filters: FiltersType;
  organizations: Array<{ id: string; name: string; type: string }>;
  literature: Array<{ id: string; title: string; category: string }>;
  categories: string[];
  onFiltersChange: (filters: FiltersType) => void;
  loading?: boolean;
}

const reportTypeLabels = {
  [ReportType.MOVEMENT]: 'Движение литературы',
  [ReportType.FINANCIAL]: 'Финансовый отчет',
  [ReportType.INVENTORY]: 'Остатки на складах',
};

const quickDateRanges = [
  {
    label: 'Текущий месяц',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Прошлый месяц',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: 'Последние 3 месяца',
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 2)),
      end: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Текущий год',
    getValue: () => ({
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(new Date().getFullYear(), 11, 31),
    }),
  },
];

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  organizations,
  literature,
  categories,
  onFiltersChange,
  loading: _loading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(
    filters.startDate ? new Date(filters.startDate) : subMonths(new Date(), 1)
  );
  const [endDate, setEndDate] = useState<Date | null>(
    filters.endDate ? new Date(filters.endDate) : new Date()
  );

  useEffect(() => {
    if (startDate && endDate) {
      const newFilters = {
        ...filters,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      };
      onFiltersChange(newFilters);
    }
  }, [startDate, endDate]);

  const handleFilterChange = (key: keyof FiltersType, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value === '' ? undefined : value,
    };
    onFiltersChange(newFilters);
  };

  const handleQuickDateRange = (range: typeof quickDateRanges[0]) => {
    const { start, end } = range.getValue();
    setStartDate(start);
    setEndDate(end);
  };

  const clearFilters = () => {
    const clearedFilters: FiltersType = {
      type: filters.type,
      startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    };
    setStartDate(subMonths(new Date(), 1));
    setEndDate(new Date());
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Boolean(
    filters.organizationId || filters.literatureId || filters.category
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Основные фильтры */}
        <Grid container spacing={3} alignItems="center">
          {/* Тип отчета */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Тип отчета</InputLabel>
              <Select
                value={filters.type}
                label="Тип отчета"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Период с */}
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Период с"
              value={startDate}
              onChange={setStartDate}
              format="dd.MM.yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'medium',
                },
              }}
            />
          </Grid>

          {/* Период по */}
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Период по"
              value={endDate}
              onChange={setEndDate}
              format="dd.MM.yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'medium',
                },
              }}
            />
          </Grid>

          {/* Кнопки управления */}
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              {hasActiveFilters && (
                <Chip
                  label="Есть фильтры"
                  color="primary"
                  size="small"
                  onDelete={clearFilters}
                />
              )}
              <IconButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              >
                <FilterList />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Быстрые периоды */}
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Быстрый выбор периода:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {quickDateRanges.map((range) => (
              <Chip
                key={range.label}
                label={range.label}
                size="small"
                variant="outlined"
                onClick={() => handleQuickDateRange(range)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Расширенные фильтры */}
        <Collapse in={expanded}>
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Дополнительные фильтры
            </Typography>
            <Grid container spacing={3}>
              {/* Организация */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Организация</InputLabel>
                  <Select
                    value={filters.organizationId || ''}
                    label="Организация"
                    onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                  >
                    <MenuItem value="">Все организации</MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name} ({org.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Литература */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Литература</InputLabel>
                  <Select
                    value={filters.literatureId || ''}
                    label="Литература"
                    onChange={(e) => handleFilterChange('literatureId', e.target.value)}
                  >
                    <MenuItem value="">Вся литература</MenuItem>
                    {literature.map((lit) => (
                      <MenuItem key={lit.id} value={lit.id}>
                        {lit.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Категория */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Категория</InputLabel>
                  <Select
                    value={filters.category || ''}
                    label="Категория"
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <MenuItem value="">Все категории</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Активные фильтры */}
            {hasActiveFilters && (
              <Box mt={3}>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  Активные фильтры:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {filters.organizationId && (
                    <Chip
                      label={`Организация: ${
                        organizations.find(o => o.id === filters.organizationId)?.name || 'Неизвестно'
                      }`}
                      size="small"
                      onDelete={() => handleFilterChange('organizationId', undefined)}
                    />
                  )}
                  {filters.literatureId && (
                    <Chip
                      label={`Литература: ${
                        literature.find(l => l.id === filters.literatureId)?.title || 'Неизвестно'
                      }`}
                      size="small"
                      onDelete={() => handleFilterChange('literatureId', undefined)}
                    />
                  )}
                  {filters.category && (
                    <Chip
                      label={`Категория: ${filters.category}`}
                      size="small"
                      onDelete={() => handleFilterChange('category', undefined)}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  );
};