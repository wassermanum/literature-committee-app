import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Speed,
  Memory,
  Timeline,
  ExpandMore,
  ExpandLess,
  Refresh,
} from '@mui/icons-material';
// import { useQueryClient } from '@tanstack/react-query'; // Unused import
import { performanceMonitor } from '../../utils/performance';
import { useQueryPerformance } from '../../hooks/useOptimizedQueries';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showInProduction = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const { getQueryStats, clearStaleQueries } = useQueryPerformance();
  const [queryStats, setQueryStats] = useState<any>(null);

  // Показываем только в development или если явно разрешено
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  useEffect(() => {
    if (!shouldShow) return;

    const updateMetrics = () => {
      // Обновляем информацию о памяти
      const memory = performanceMonitor.getMemoryInfo();
      setMemoryInfo(memory);

      // Обновляем метрики производительности
      const metrics = performanceMonitor.getAllMetrics();
      setPerformanceMetrics(metrics);

      // Обновляем статистику запросов
      const stats = getQueryStats();
      setQueryStats(stats);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000); // Обновляем каждые 2 секунды

    return () => clearInterval(interval);
  }, [shouldShow, getQueryStats]);

  const handleClearStaleQueries = () => {
    const clearedCount = clearStaleQueries();
    console.log(`Cleared ${clearedCount} stale queries`);
  };

  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    setPerformanceMetrics([]);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMemoryUsagePercentage = () => {
    if (!memoryInfo) return 0;
    return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: isExpanded ? 800 : 300,
        transition: 'max-width 0.3s ease',
      }}
    >
      <Card elevation={8}>
        <CardContent sx={{ pb: 1 }}>
          {/* Заголовок */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Speed color="primary" />
              <Typography variant="h6">Performance Monitor</Typography>
            </Box>
            <Box>
              <IconButton size="small" onClick={handleClearMetrics} title="Clear Metrics">
                <Refresh />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          {/* Краткая информация */}
          <Grid container spacing={1} mb={1}>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Memory fontSize="small" />
                <Typography variant="body2">
                  Memory: {memoryInfo ? formatBytes(memoryInfo.usedJSHeapSize) : 'N/A'}
                </Typography>
              </Box>
              {memoryInfo && (
                <LinearProgress
                  variant="determinate"
                  value={getMemoryUsagePercentage()}
                  sx={{ mt: 0.5, height: 4 }}
                  color={getMemoryUsagePercentage() > 80 ? 'error' : 'primary'}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Timeline fontSize="small" />
                <Typography variant="body2">
                  Queries: {queryStats?.totalQueries || 0}
                </Typography>
              </Box>
              <Box display="flex" gap={0.5} mt={0.5}>
                <Chip
                  label={`Active: ${queryStats?.activeQueries || 0}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Stale: ${queryStats?.staleQueries || 0}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Развернутая информация */}
          <Collapse in={isExpanded}>
            <Box mt={2}>
              {/* Детальная информация о памяти */}
              {memoryInfo && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Memory Details
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Used: {formatBytes(memoryInfo.usedJSHeapSize)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Total: {formatBytes(memoryInfo.totalJSHeapSize)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Limit: {formatBytes(memoryInfo.jsHeapSizeLimit)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Статистика запросов */}
              {queryStats && (
                <Box mb={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle2">Query Cache Stats</Typography>
                    <IconButton size="small" onClick={handleClearStaleQueries}>
                      <Refresh fontSize="small" />
                    </IconButton>
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <Chip
                        label={`Total: ${queryStats.totalQueries}`}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Chip
                        label={`Active: ${queryStats.activeQueries}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Chip
                        label={`Stale: ${queryStats.staleQueries}`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Chip
                        label={`Error: ${queryStats.errorQueries}`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    Cache Size: {formatBytes(queryStats.cacheSize)}
                  </Typography>
                </Box>
              )}

              {/* Метрики производительности */}
              {performanceMetrics.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Operation</TableCell>
                          <TableCell align="right">Duration (ms)</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceMetrics
                          .filter(metric => metric.duration !== undefined)
                          .sort((a, b) => (b.duration || 0) - (a.duration || 0))
                          .slice(0, 10)
                          .map((metric, index) => (
                            <TableRow key={index}>
                              <TableCell>{metric.name}</TableCell>
                              <TableCell align="right">
                                {metric.duration?.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={metric.duration! > 100 ? 'Slow' : 'Fast'}
                                  size="small"
                                  color={metric.duration! > 100 ? 'error' : 'success'}
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceMonitor;