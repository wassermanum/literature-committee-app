import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit,
  Inventory2,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { LiteratureWithInventory } from '@/types';
import { GradientButton } from '@/components/ui';

interface LiteratureItemProps {
  literature: LiteratureWithInventory;
  onEdit?: (id: string) => void;
  onSelect?: (id: string) => void;
  selectable?: boolean;
}

const categoryColors: Record<string, string> = {
  'Базовая литература': '#2196f3',
  'Истории выздоровления': '#4caf50',
  'Медитации': '#9c27b0',
  'Служение': '#ff9800',
  'Информационные материалы': '#607d8b',
  'Рабочие тетради': '#795548',
};

export const LiteratureItem: React.FC<LiteratureItemProps> = ({
  literature,
  onEdit,
  onSelect,
  selectable = false,
}) => {
  const theme = useTheme();

  const totalQuantity = literature.totalQuantity || 0;
  // const availableQuantity = literature.availableQuantity || 0; // Unused variable
  const isLowStock = totalQuantity < 20;
  const isOutOfStock = totalQuantity === 0;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(literature.id);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(literature.id);
    }
  };

  const getStockIcon = () => {
    if (isOutOfStock) {
      return <Warning color="error" fontSize="small" />;
    }
    if (isLowStock) {
      return <Warning color="warning" fontSize="small" />;
    }
    return <CheckCircle color="success" fontSize="small" />;
  };

  const getStockColor = () => {
    if (isOutOfStock) return 'error';
    if (isLowStock) return 'warning';
    return 'success';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        cursor: selectable ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          ...(selectable && {
            borderColor: theme.palette.primary.main,
          }),
        },
      }}
      onClick={selectable ? handleSelect : undefined}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Заголовок с категорией и остатками */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Chip
            label={literature.category}
            size="small"
            sx={{
              backgroundColor: alpha(
                categoryColors[literature.category] || theme.palette.grey[500],
                0.1
              ),
              color: categoryColors[literature.category] || theme.palette.grey[500],
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
          <Tooltip
            title={
              isOutOfStock
                ? 'Нет в наличии'
                : isLowStock
                ? 'Низкий остаток'
                : 'В наличии'
            }
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              {getStockIcon()}
              <Typography
                variant="caption"
                color={`${getStockColor()}.main`}
                fontWeight={600}
              >
                {totalQuantity}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* Название */}
        <Typography
          variant="h6"
          fontWeight={600}
          mb={1}
          color="text.primary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
          }}
        >
          {literature.title}
        </Typography>

        {/* Описание */}
        <Typography
          variant="body2"
          color="text.secondary"
          mb={2}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
          }}
        >
          {literature.description}
        </Typography>

        {/* Цена */}
        <Typography
          variant="h6"
          fontWeight={700}
          color="primary.main"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {literature.price.toLocaleString('ru-RU')} ₽
        </Typography>

        {/* Информация об остатках по организациям */}
        {literature.inventory && literature.inventory.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" mb={1} display="block">
              Остатки по складам:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {literature.inventory.slice(0, 3).map((inv) => (
                <Chip
                  key={inv.id}
                  label={`${inv.organization?.name || 'Склад'}: ${inv.quantity}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {literature.inventory.length > 3 && (
                <Chip
                  label={`+${literature.inventory.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      {/* Действия */}
      {(onEdit || selectable) && (
        <CardActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
          {selectable ? (
            <GradientButton
              fullWidth
              onClick={handleSelect}
              startIcon={<Inventory2 />}
            >
              Выбрать
            </GradientButton>
          ) : (
            <Box width="100%" />
          )}
          
          {onEdit && (
            <Tooltip title="Редактировать">
              <IconButton
                onClick={handleEdit}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      )}
    </Card>
  );
};