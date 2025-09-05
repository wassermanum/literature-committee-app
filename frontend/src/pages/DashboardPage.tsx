import React from 'react';
import {
  Box,
  Typography,
  Grid,
  useTheme,
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  TrendingUp,
  People,
  Assessment,
  Notifications,
} from '@mui/icons-material';
import {
  GradientCard,
  GradientButton,
  AnimatedContainer,
} from '../components/ui';

export const DashboardPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={600} color="text.primary" mb={1}>
            Добро пожаловать в систему управления литературой
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Панель управления для литературного комитета региональной структуры обслуживания Сибирь
          </Typography>
        </Box>
      </AnimatedContainer>

      {/* Ключевые метрики */}
      <AnimatedContainer animation="slideUp" delay={200}>
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard gradient hover>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.primary,
                    color: 'white',
                  }}
                >
                  <ShoppingCart />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    24
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Активных заказов
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard gradient hover>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.secondary,
                    color: 'white',
                  }}
                >
                  <Inventory />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="secondary.main">
                    1,247
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Единиц на складе
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard gradient hover>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.accent,
                    color: 'white',
                  }}
                >
                  <TrendingUp />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    +12%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Рост за месяц
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard gradient hover>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.neutral,
                    color: 'white',
                  }}
                >
                  <People />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    47
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Активных пользователей
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
        </Grid>
      </AnimatedContainer>

      {/* Быстрые действия */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <AnimatedContainer animation="slideUp" delay={300}>
            <GradientCard gradient>
              <Typography variant="h5" fontWeight={600} mb={3}>
                Быстрые действия
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <GradientButton
                    fullWidth
                    startIcon={<ShoppingCart />}
                    gradient="primary"
                    sx={{ py: 2 }}
                  >
                    Создать новый заказ
                  </GradientButton>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <GradientButton
                    fullWidth
                    startIcon={<Inventory />}
                    gradient="secondary"
                    sx={{ py: 2 }}
                  >
                    Добавить литературу
                  </GradientButton>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <GradientButton
                    fullWidth
                    startIcon={<Assessment />}
                    gradient="accent"
                    sx={{ py: 2 }}
                  >
                    Сформировать отчет
                  </GradientButton>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <GradientButton
                    fullWidth
                    startIcon={<People />}
                    gradient="primary"
                    sx={{ py: 2 }}
                  >
                    Управление пользователями
                  </GradientButton>
                </Grid>
              </Grid>
            </GradientCard>
          </AnimatedContainer>
        </Grid>

        <Grid item xs={12} md={4}>
          <AnimatedContainer animation="slideUp" delay={400}>
            <GradientCard gradient>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Notifications color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Уведомления
                </Typography>
              </Box>
              <Box>
                <Box mb={2} p={2} sx={{ bgcolor: theme.colors.primary[50], borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={500} mb={1}>
                    Низкие остатки
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    У 3 позиций литературы заканчиваются остатки
                  </Typography>
                </Box>
                <Box mb={2} p={2} sx={{ bgcolor: theme.colors.brown[50], borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={500} mb={1}>
                    Новый заказ
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Поступил заказ от группы "Надежда"
                  </Typography>
                </Box>
                <Box p={2} sx={{ bgcolor: theme.colors.primary[50], borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={500} mb={1}>
                    Готов к отгрузке
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Заказ ORD-2024-001 готов к отгрузке
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </AnimatedContainer>
        </Grid>
      </Grid>

      {/* Демонстрация дизайн-системы */}
      <AnimatedContainer animation="slideUp" delay={500}>
        <Box mt={6}>
          <Typography variant="h5" fontWeight={600} mb={3}>
            Дизайн-система готова! 🎨
          </Typography>
          <GradientCard gradient>
            <Typography variant="body1" mb={2}>
              Создана полная дизайн-система с:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Лаконичным стилем с градиентными переходами</li>
              <li>Цветовой палитрой в тёмно-серых/коричневых тонах с синими акцентами</li>
              <li>Плавными анимациями и переходами</li>
              <li>Адаптивным дизайном для различных устройств</li>
              <li>Библиотекой переиспользуемых UI компонентов</li>
              <li>Плавным скроллингом и современными эффектами</li>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Все компоненты готовы для использования в следующих задачах разработки!
            </Typography>
          </GradientCard>
        </Box>
      </AnimatedContainer>
    </Box>
  );
};