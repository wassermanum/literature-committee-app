import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  AttachMoney,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ReportData,
  ReportType,
  MovementReportItem,
  FinancialReportItem,
  InventoryReportItem,
} from '@/types';
import { AnimatedContainer, GradientCard } from '@/components/ui';

interface ReportViewerProps {
  reportData: ReportData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
};

const MovementReportView: React.FC<{ data: MovementReportItem[] }> = ({ data }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'success';
      case 'outgoing':
        return 'error';
      case 'adjustment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'Поступление';
      case 'outgoing':
        return 'Отгрузка';
      case 'adjustment':
        return 'Корректировка';
      default:
        return type;
    }
  };

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Дата</TableCell>
            <TableCell>Тип</TableCell>
            <TableCell>Литература</TableCell>
            <TableCell align="right">Количество</TableCell>
            <TableCell align="right">Цена за ед.</TableCell>
            <TableCell align="right">Сумма</TableCell>
            <TableCell>От/К организации</TableCell>
            <TableCell>Заказ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>
                <Chip
                  label={getTypeLabel(item.type)}
                  color={getTypeColor(item.type) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>{item.literatureTitle}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell align="right">{formatCurrency(item.totalAmount)}</TableCell>
              <TableCell>
                {item.type === 'incoming' && item.fromOrganization && (
                  <Typography variant="body2">
                    От: {item.fromOrganization.name}
                  </Typography>
                )}
                <Typography variant="body2">
                  {item.type === 'incoming' ? 'К' : 'От'}: {item.toOrganization.name}
                </Typography>
              </TableCell>
              <TableCell>
                {item.orderNumber && (
                  <Typography variant="body2" color="primary">
                    {item.orderNumber}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const FinancialReportView: React.FC<{ data: FinancialReportItem[] }> = ({ data }) => {
  return (
    <Box>
      {data.map((item) => (
        <Card key={`${item.organizationId}-${item.period}`} sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {item.organizationName} - {item.period}
              </Typography>
              <Box display="flex" gap={2}>
                <Chip
                  label={`Доходы: ${formatCurrency(item.totalIncome)}`}
                  color="success"
                  icon={<TrendingUp />}
                />
                <Chip
                  label={`Расходы: ${formatCurrency(item.totalExpenses)}`}
                  color="error"
                  icon={<TrendingDown />}
                />
                <Chip
                  label={`Прибыль: ${formatCurrency(item.netProfit)}`}
                  color={item.netProfit >= 0 ? 'success' : 'error'}
                  icon={<AttachMoney />}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Литература</TableCell>
                    <TableCell align="right">Продано</TableCell>
                    <TableCell align="right">Выручка</TableCell>
                    <TableCell align="right">Себестоимость</TableCell>
                    <TableCell align="right">Прибыль</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {item.literatureBreakdown.map((breakdown) => (
                    <TableRow key={breakdown.literatureId}>
                      <TableCell>{breakdown.literatureTitle}</TableCell>
                      <TableCell align="right">{breakdown.quantitySold}</TableCell>
                      <TableCell align="right">{formatCurrency(breakdown.revenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(breakdown.cost)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={breakdown.profit >= 0 ? 'success.main' : 'error.main'}
                          fontWeight={600}
                        >
                          {formatCurrency(breakdown.profit)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

const InventoryReportView: React.FC<{ data: InventoryReportItem[] }> = ({ data }) => {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Литература</TableCell>
            <TableCell>Категория</TableCell>
            <TableCell align="right">Цена за ед.</TableCell>
            <TableCell align="right">Общее кол-во</TableCell>
            <TableCell align="right">Общая стоимость</TableCell>
            <TableCell>Распределение по складам</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.literatureId} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {item.literatureTitle}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={item.category} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell align="right">
                <Typography fontWeight={600}>{item.totalQuantity}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight={600} color="primary">
                  {formatCurrency(item.totalValue)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {item.organizations.map((org) => (
                    <Box key={org.organizationId} display="flex" justifyContent="space-between">
                      <Typography variant="caption">
                        {org.organizationName}:
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {org.quantity} ({org.availableQuantity} доступно)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const ReportViewer: React.FC<ReportViewerProps> = ({ reportData }) => {
  const renderSummary = () => {
    if (!reportData.summary) return null;

    return (
      <AnimatedContainer animation="slideUp" delay={100}>
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <GradientCard gradient>
              <Box display="flex" alignItems="center" gap={2}>
                <Inventory color="primary" />
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {reportData.summary.totalItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего записей
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>

          {reportData.summary.totalQuantity && (
            <Grid item xs={12} sm={6} md={3}>
              <GradientCard gradient>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUp color="success" />
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {reportData.summary.totalQuantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Общее количество
                    </Typography>
                  </Box>
                </Box>
              </GradientCard>
            </Grid>
          )}

          {reportData.summary.totalValue && (
            <Grid item xs={12} sm={6} md={3}>
              <GradientCard gradient>
                <Box display="flex" alignItems="center" gap={2}>
                  <AttachMoney color="warning" />
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {formatCurrency(reportData.summary.totalValue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Общая стоимость
                    </Typography>
                  </Box>
                </Box>
              </GradientCard>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <GradientCard gradient>
              <Box display="flex" alignItems="center" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Период отчета
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {format(new Date(reportData.filters.startDate), 'dd.MM.yyyy', { locale: ru })} -{' '}
                    {format(new Date(reportData.filters.endDate), 'dd.MM.yyyy', { locale: ru })}
                  </Typography>
                </Box>
              </Box>
            </GradientCard>
          </Grid>
        </Grid>
      </AnimatedContainer>
    );
  };

  const renderReportContent = () => {
    switch (reportData.type) {
      case ReportType.MOVEMENT:
        return <MovementReportView data={reportData.data as MovementReportItem[]} />;
      case ReportType.FINANCIAL:
        return <FinancialReportView data={reportData.data as FinancialReportItem[]} />;
      case ReportType.INVENTORY:
        return <InventoryReportView data={reportData.data as InventoryReportItem[]} />;
      default:
        return (
          <Typography color="text.secondary">
            Неподдерживаемый тип отчета: {reportData.type}
          </Typography>
        );
    }
  };

  return (
    <Box>
      {/* Заголовок отчета */}
      <AnimatedContainer animation="slideDown" delay={50}>
        <Box mb={4}>
          <Typography variant="h5" fontWeight={600} mb={1}>
            {reportData.type === ReportType.MOVEMENT && 'Отчет по движению литературы'}
            {reportData.type === ReportType.FINANCIAL && 'Финансовый отчет'}
            {reportData.type === ReportType.INVENTORY && 'Отчет по остаткам на складах'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Сформирован: {formatDate(reportData.generatedAt)}
          </Typography>
        </Box>
      </AnimatedContainer>

      {/* Сводка */}
      {renderSummary()}

      {/* Содержимое отчета */}
      <AnimatedContainer animation="slideUp" delay={200}>
        {reportData.data.length > 0 ? (
          renderReportContent()
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              Нет данных для отображения
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Попробуйте изменить параметры фильтрации или период отчета
            </Typography>
          </Paper>
        )}
      </AnimatedContainer>
    </Box>
  );
};