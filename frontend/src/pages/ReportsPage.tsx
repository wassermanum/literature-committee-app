import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  useTheme,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  PieChart,
  BarChart,
  GetApp,
} from '@mui/icons-material';
import {
  GradientCard,
  GradientButton,
  AnimatedContainer,
} from '../components/ui';

export const ReportsPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Отчеты и аналитика
          </Typography>
          <GradientButton startIcon={<GetApp />}>
            Экспорт отчета
          </GradientButton>
        </Box>
      </AnimatedContainer>

      {/* Фильтры отчетов */}
      <AnimatedContainer animation="slideUp" delay={200}>
        <GradientCard gradient sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Параметры отчета
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Тип отчета</InputLabel>
                <Select defaultValue="movement" label="Тип отчета">
                  <MenuItem value="movement">Движение литературы</MenuItem>
                  <MenuItem value="financial">Финансовый отчет</MenuItem>
                  <MenuItem value="inventory">Остатки на складах</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Дата начала"
                type="date"
                InputLabelProps={{ shrink: true }}
                defaultValue="2024-01-01"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Дата окончания"
                type="date"
                InputLabelProps={{ shrink: true }}
                defaultValue="2024-01-31"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <GradientButton fullWidth startIcon={<Assessment />}>
                Сформировать
              </GradientButton>
            </Grid>
          </Grid>
        </GradientCard>
      </AnimatedContainer>

      {/* Ключевые показатели */}
      <AnimatedContainer animation="slideUp" delay={300}>
        <Typography variant="h5" fontWeight={600} mb={3}>
          Ключевые показатели
        </Typography>
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.primary,
                    color: 'white',
                  }}
                >
                  <TrendingUp />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    156
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Заказов за месяц
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.secondary,
                    color: 'white',
                  }}
                >
                  <BarChart />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="secondary.main">
                    ₽847K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Оборот за месяц
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.accent,
                    color: 'white',
                  }}
                >
                  <PieChart />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    2,340
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Единиц литературы
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.colors.gradients.neutral,
                    color: 'white',
                  }}
                >
                  <Assessment />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    94%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Выполнено заказов
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
        </Grid>
      </AnimatedContainer>

      {/* Графики и диаграммы */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <AnimatedContainer animation="slideUp" delay={400}>
            <GradientCard gradient>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Динамика заказов
              </Typography>
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: theme.colors.gradients.primary,
                  borderRadius: 2,
                  color: 'white',
                }}
              >
                <Typography variant="h6">
                  График будет реализован в следующих задачах
                </Typography>
              </Box>
            </GradientCard>
          </AnimatedContainer>
        </Grid>
        <Grid item xs={12} lg={4}>
          <AnimatedContainer animation="slideUp" delay={500}>
            <GradientCard gradient>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Распределение по категориям
              </Typography>
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: theme.colors.gradients.secondary,
                  borderRadius: 2,
                  color: 'white',
                }}
              >
                <Typography variant="h6" textAlign="center">
                  Круговая диаграмма будет реализована в следующих задачах
                </Typography>
              </Box>
            </GradientCard>
          </AnimatedContainer>
        </Grid>
      </Grid>

      {/* Детальная таблица */}
      <AnimatedContainer animation="slideUp" delay={600}>
        <Box mt={4}>
          <GradientCard gradient>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Детальный отчет по движению литературы
            </Typography>
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="body1">
                Детальная таблица отчетов будет реализована в следующих задачах
              </Typography>
            </Box>
          </GradientCard>
        </Box>
      </AnimatedContainer>
    </Box>
  );
};