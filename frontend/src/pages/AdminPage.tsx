import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  People,
  Settings,
  Security,
  Add,
  Edit,
  Delete,
  AdminPanelSettings,
} from '@mui/icons-material';
import {
  GradientCard,
  GradientButton,
  AnimatedContainer,
  StatusChip,
} from '../components/ui';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Моковые данные
const mockUsers = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan@example.com',
    role: 'region',
    organization: 'Регион Сибирь',
    status: 'active',
    lastLogin: '2024-01-15',
  },
  {
    id: '2',
    name: 'Мария Сидорова',
    email: 'maria@example.com',
    role: 'locality',
    organization: 'Местность Новосибирск',
    status: 'active',
    lastLogin: '2024-01-14',
  },
  {
    id: '3',
    name: 'Алексей Иванов',
    email: 'alexey@example.com',
    role: 'group',
    organization: 'Группа "Надежда"',
    status: 'inactive',
    lastLogin: '2024-01-10',
  },
];

const roleLabels: Record<string, string> = {
  region: 'Регион',
  locality: 'Местность',
  local_subcommittee: 'Подкомитет',
  group: 'Группа',
  admin: 'Администратор',
};

export const AdminPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Администрирование
          </Typography>
          <GradientButton startIcon={<AdminPanelSettings />}>
            Системные настройки
          </GradientButton>
        </Box>
      </AnimatedContainer>

      <AnimatedContainer animation="slideUp" delay={200}>
        <GradientCard gradient>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin tabs"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2,
            }}
          >
            <Tab
              icon={<People />}
              label="Пользователи"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab
              icon={<Security />}
              label="Роли и права"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab
              icon={<Settings />}
              label="Настройки системы"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                Управление пользователями
              </Typography>
              <GradientButton startIcon={<Add />} size="small">
                Добавить пользователя
              </GradientButton>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Пользователь</TableCell>
                    <TableCell>Роль</TableCell>
                    <TableCell>Организация</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Последний вход</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.colors.primary[50],
                        },
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: theme.colors.primary[500],
                              width: 32,
                              height: 32,
                            }}
                          >
                            {user.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {roleLabels[user.role]}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.organization}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          status={user.status === 'active' ? 'completed' : 'rejected'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.lastLogin}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton size="small" color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Управление ролями и правами доступа
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(roleLabels).map(([role, label]) => (
                <Grid item xs={12} md={6} key={role}>
                  <Box
                    sx={{
                      p: 3,
                      border: `1px solid ${theme.colors.neutral[200]}`,
                      borderRadius: 2,
                      background: theme.colors.primary[50],
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>
                      {label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Настройка прав доступа для роли "{label}" будет реализована в
                      следующих задачах
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Системные настройки
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    border: `1px solid ${theme.colors.neutral[200]}`,
                    borderRadius: 2,
                    background: theme.colors.brown[50],
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Общие настройки
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Конфигурация системы, уведомлений и интеграций
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    border: `1px solid ${theme.colors.neutral[200]}`,
                    borderRadius: 2,
                    background: theme.colors.brown[50],
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Безопасность
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Настройки аутентификации и безопасности
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </GradientCard>
      </AnimatedContainer>
    </Box>
  );
};