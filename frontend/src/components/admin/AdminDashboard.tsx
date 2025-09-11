import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People,
  Business,
  Settings,
  Security,
  TrendingUp,
  // PersonAdd, // Unused import
  Assessment,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UserRole, OrganizationType } from '../../types';
import { useAdminStats, useOrganizations } from '../../hooks/useAdmin';
import { AnimatedContainer, GradientCard } from '../ui';
import { UserManagement } from './UserManagement';
import { RoleAssignment } from './RoleAssignment';
import { SystemSettings } from './SystemSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const roleLabels = {
  [UserRole.GROUP]: 'Группы',
  [UserRole.LOCAL_SUBCOMMITTEE]: 'Местные подкомитеты',
  [UserRole.LOCALITY]: 'Местности',
  [UserRole.REGION]: 'Регионы',
  [UserRole.ADMIN]: 'Администраторы',
};

const orgTypeLabels = {
  [OrganizationType.GROUP]: 'Группы',
  [OrganizationType.LOCAL_SUBCOMMITTEE]: 'Местные подкомитеты',
  [OrganizationType.LOCALITY]: 'Местности',
  [OrganizationType.REGION]: 'Регионы',
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { stats, loading: statsLoading, error: statsError } = useAdminStats();
  const { organizations } = useOrganizations(1, 1000); // Загружаем все организации

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderStatsCards = () => {
    if (statsLoading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (!stats) return null;

    return (
      <Grid container spacing={3}>
        {/* Общая статистика */}
        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  color: 'white',
                }}
              >
                <People />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего пользователей
                </Typography>
                <Typography variant="caption" color="success.main">
                  {stats.activeUsers} активных
                </Typography>
              </Box>
            </Box>
          </GradientCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'secondary.main',
                  color: 'white',
                }}
              >
                <Business />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="secondary.main">
                  {stats.totalOrganizations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего организаций
                </Typography>
                <Typography variant="caption" color="success.main">
                  {stats.activeOrganizations} активных
                </Typography>
              </Box>
            </Box>
          </GradientCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'success.main',
                  color: 'white',
                }}
              >
                <TrendingUp />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Активность пользователей
                </Typography>
              </Box>
            </Box>
          </GradientCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'info.main',
                  color: 'white',
                }}
              >
                <Assessment />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="info.main">
                  {stats.recentActivity.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Недавних действий
                </Typography>
              </Box>
            </Box>
          </GradientCard>
        </Grid>

        {/* Распределение по ролям */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Пользователи по ролям
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <Box key={role} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {roleLabels[role as UserRole] || role}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Распределение организаций */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Организации по типам
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {Object.entries(stats.organizationsByType).map(([type, count]) => (
                  <Box key={type} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {orgTypeLabels[type as OrganizationType] || type}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Недавняя активность */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Недавняя активность
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {stats.recentActivity.slice(0, 10).map((activity, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2">
                        <strong>{activity.user}</strong> {activity.action} {activity.target}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(activity.date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      {/* Заголовок */}
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={600} mb={1}>
            Административная панель
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Управление пользователями, организациями и системными настройками
          </Typography>
        </Box>
      </AnimatedContainer>

      {/* Ошибки */}
      {statsError && (
        <AnimatedContainer animation="slideUp" delay={150}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {statsError}
          </Alert>
        </AnimatedContainer>
      )}

      {/* Вкладки */}
      <AnimatedContainer animation="slideUp" delay={200}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              icon={<Assessment />}
              label="Обзор"
              iconPosition="start"
            />
            <Tab
              icon={<People />}
              label="Пользователи"
              iconPosition="start"
            />
            <Tab
              icon={<Security />}
              label="Права доступа"
              iconPosition="start"
            />
            <Tab
              icon={<Settings />}
              label="Настройки"
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </AnimatedContainer>

      {/* Содержимое вкладок */}
      <TabPanel value={activeTab} index={0}>
        <AnimatedContainer animation="slideUp" delay={300}>
          {renderStatsCards()}
        </AnimatedContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <AnimatedContainer animation="slideUp" delay={300}>
          <UserManagement organizations={organizations} />
        </AnimatedContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <AnimatedContainer animation="slideUp" delay={300}>
          <RoleAssignment />
        </AnimatedContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <AnimatedContainer animation="slideUp" delay={300}>
          <SystemSettings />
        </AnimatedContainer>
      </TabPanel>
    </Box>
  );
};