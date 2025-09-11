import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Grid,
  IconButton,
  Collapse,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  // ExpandMore, // Unused import
  // ExpandLess, // Unused import
} from '@mui/icons-material';
import { LiteratureFilters as FiltersType } from '@/types';

interface LiteratureFiltersProps {
  filters: FiltersType;
  categories: string[];
  onFiltersChange: (filters: FiltersType) => void;
}

export const LiteratureFilters: React.FC<LiteratureFiltersProps> = ({
  filters,
  categories,
  onFiltersChange,
}) => {
  const [localFilters, setLocalFilters] = useState<FiltersType>(filters);
  const [expanded, setExpanded] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Обновляем локальные фильтры при изменении внешних
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Обработка изменения поиска с задержкой
  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value || undefined };
    setLocalFilters(newFilters);

    // Очищаем предыдущий таймер
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Устанавливаем новый таймер для отложенного поиска
    const timeout = setTimeout(() => {
      onFiltersChange(newFilters);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleFilterChange = (key: keyof FiltersType, value: any) => {
    const newFilters = {
      ...localFilters,
      [key]: value === '' ? undefined : value,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FiltersType = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (value) => value !== undefined && value !== null && value !== ''
  );

  const activeFiltersCount = Object.values(localFilters).filter(
    (value) => value !== undefined && value !== null && value !== ''
  ).length;

  return (
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
      {/* Основная строка поиска */}
      <Box display="flex" gap={2} alignItems="center" mb={expanded ? 3 : 0}>
        <TextField
          fullWidth
          placeholder="Поиск по названию или описанию..."
          value={localFilters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: localFilters.search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleSearchChange('')}
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600 }}
        />

        <Box display="flex" alignItems="center" gap={1}>
          {hasActiveFilters && (
            <Chip
              label={`Фильтров: ${activeFiltersCount}`}
              color="primary"
              size="small"
              onDelete={handleClearFilters}
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
      </Box>

      {/* Расширенные фильтры */}
      <Collapse in={expanded}>
        <Grid container spacing={3}>
          {/* Категория */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Категория</InputLabel>
              <Select
                value={localFilters.category || ''}
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

          {/* Минимальная цена */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Цена от"
              type="number"
              value={localFilters.minPrice || ''}
              onChange={(e) =>
                handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">₽</InputAdornment>,
              }}
            />
          </Grid>

          {/* Максимальная цена */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Цена до"
              type="number"
              value={localFilters.maxPrice || ''}
              onChange={(e) =>
                handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">₽</InputAdornment>,
              }}
            />
          </Grid>

          {/* Активность */}
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" height="100%">
              <FormControlLabel
                control={
                  <Switch
                    checked={localFilters.isActive !== false}
                    onChange={(e) =>
                      handleFilterChange('isActive', e.target.checked ? undefined : false)
                    }
                  />
                }
                label="Только активные"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Активные фильтры:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {localFilters.search && (
                <Chip
                  label={`Поиск: "${localFilters.search}"`}
                  size="small"
                  onDelete={() => handleFilterChange('search', undefined)}
                />
              )}
              {localFilters.category && (
                <Chip
                  label={`Категория: ${localFilters.category}`}
                  size="small"
                  onDelete={() => handleFilterChange('category', undefined)}
                />
              )}
              {localFilters.minPrice && (
                <Chip
                  label={`От: ${localFilters.minPrice}₽`}
                  size="small"
                  onDelete={() => handleFilterChange('minPrice', undefined)}
                />
              )}
              {localFilters.maxPrice && (
                <Chip
                  label={`До: ${localFilters.maxPrice}₽`}
                  size="small"
                  onDelete={() => handleFilterChange('maxPrice', undefined)}
                />
              )}
              {localFilters.isActive === false && (
                <Chip
                  label="Включая неактивные"
                  size="small"
                  onDelete={() => handleFilterChange('isActive', undefined)}
                />
              )}
            </Box>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};