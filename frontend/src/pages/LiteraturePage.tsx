import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Inventory2,
} from '@mui/icons-material';
import {
  GradientCard,
  GradientButton,
  AnimatedContainer,
} from '../components/ui';

// Моковые данные для демонстрации
const mockLiterature = [
  {
    id: '1',
    title: 'Анонимные Наркоманы - Базовый текст',
    description: 'Основная литература сообщества АН',
    category: 'Базовая литература',
    price: 350,
    inventory: 45,
  },
  {
    id: '2',
    title: 'Это работает: Как и почему',
    description: 'Сборник историй выздоровления',
    category: 'Истории выздоровления',
    price: 280,
    inventory: 23,
  },
  {
    id: '3',
    title: 'Просто на сегодня',
    description: 'Ежедневные размышления',
    category: 'Медитации',
    price: 420,
    inventory: 67,
  },
  {
    id: '4',
    title: 'Руководящие принципы',
    description: 'Принципы работы групп АН',
    category: 'Служение',
    price: 180,
    inventory: 12,
  },
];

const categoryColors: Record<string, string> = {
  'Базовая литература': '#2196f3',
  'Истории выздоровления': '#4caf50',
  'Медитации': '#9c27b0',
  'Служение': '#ff9800',
};

export const LiteraturePage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Каталог литературы
          </Typography>
          <GradientButton startIcon={<Add />}>
            Добавить литературу
          </GradientButton>
        </Box>
      </AnimatedContainer>

      <AnimatedContainer animation="slideUp" delay={200}>
        <Box mb={4}>
          <TextField
            fullWidth
            placeholder="Поиск литературы..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 600 }}
          />
        </Box>
      </AnimatedContainer>

      <Grid container spacing={3}>
        {mockLiterature.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <AnimatedContainer animation="slideUp" delay={300 + index * 100}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `1px solid ${alpha(theme.colors.neutral[200], 0.5)}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Chip
                      label={item.category}
                      size="small"
                      sx={{
                        backgroundColor: alpha(categoryColors[item.category] || '#757575', 0.1),
                        color: categoryColors[item.category] || '#757575',
                        fontWeight: 500,
                      }}
                    />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Inventory2 fontSize="small" color="action" />
                      <Typography
                        variant="caption"
                        color={item.inventory < 20 ? 'error' : 'text.secondary'}
                        fontWeight={500}
                      >
                        {item.inventory}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight={600} mb={1} color="text.primary">
                    {item.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {item.description}
                  </Typography>

                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {item.price} ₽
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <GradientButton
                    size="small"
                    startIcon={<Edit />}
                    gradient="secondary"
                    fullWidth
                  >
                    Редактировать
                  </GradientButton>
                </CardActions>
              </Card>
            </AnimatedContainer>
          </Grid>
        ))}
      </Grid>

      {/* Статистика */}
      <AnimatedContainer animation="slideUp" delay={600}>
        <Box mt={6}>
          <Typography variant="h5" fontWeight={600} mb={3}>
            Статистика каталога
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <GradientCard gradient>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {mockLiterature.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего позиций
                </Typography>
              </GradientCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <GradientCard gradient>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {mockLiterature.reduce((sum, item) => sum + item.inventory, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Общий остаток
                </Typography>
              </GradientCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <GradientCard gradient>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {mockLiterature.filter(item => item.inventory < 20).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Низкие остатки
                </Typography>
              </GradientCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <GradientCard gradient>
                <Typography variant="h4" fontWeight={700} color="info.main">
                  {new Set(mockLiterature.map(item => item.category)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Категорий
                </Typography>
              </GradientCard>
            </Grid>
          </Grid>
        </Box>
      </AnimatedContainer>
    </Box>
  );
};