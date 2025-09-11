import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  // Divider, // Unused import
} from '@mui/material';
import {
  ExpandMore,
  Security,
  Person,
  Business,
  Assessment,
  Inventory,
} from '@mui/icons-material';
// import { LoadingButton } from '@mui/lab'; // Unused import
import { UserRole, RolePermission } from '../../types';
import { useRolePermissions } from '../../hooks/useAdmin';
import { AnimatedContainer } from '../ui';

const roleLabels = {
  [UserRole.GROUP]: 'Группа',
  [UserRole.LOCAL_SUBCOMMITTEE]: 'Местный подкомитет',
  [UserRole.LOCALITY]: 'Местность',
  [UserRole.REGION]: 'Регион',
  [UserRole.ADMIN]: 'Администратор',
};

const roleColors = {
  [UserRole.GROUP]: 'default',
  [UserRole.LOCAL_SUBCOMMITTEE]: 'info',
  [UserRole.LOCALITY]: 'warning',
  [UserRole.REGION]: 'success',
  [UserRole.ADMIN]: 'error',
} as const;

const resourceLabels: Record<string, string> = {
  users: 'Пользователи',
  organizations: 'Организации',
  literature: 'Литература',
  orders: 'Заказы',
  reports: 'Отчеты',
  inventory: 'Остатки',
  settings: 'Настройки',
};

const actionLabels: Record<string, string> = {
  create: 'Создание',
  read: 'Просмотр',
  update: 'Редактирование',
  delete: 'Удаление',
  export: 'Экспорт',
  import: 'Импорт',
  manage: 'Управление',
};

const getResourceIcon = (resource: string) => {
  switch (resource) {
    case 'users':
      return <Person fontSize="small" />;
    case 'organizations':
      return <Business fontSize="small" />;
    case 'literature':
      return <Inventory fontSize="small" />;
    case 'reports':
      return <Assessment fontSize="small" />;
    default:
      return <Security fontSize="small" />;
  }
};

export const RoleAssignment: React.FC = () => {
  const { permissions, error, updatePermission } = useRolePermissions();
  const [updatingPermissions, setUpdatingPermissions] = useState<Set<string>>(new Set());

  const handlePermissionChange = async (permission: RolePermission, allowed: boolean) => {
    try {
      setUpdatingPermissions(prev => new Set(prev).add(permission.id));
      await updatePermission(permission.id, { allowed });
    } catch (err) {
      // Ошибка уже обработана в хуке
    } finally {
      setUpdatingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(permission.id);
        return newSet;
      });
    }
  };

  // Группируем права по ролям и ресурсам
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.role]) {
      acc[permission.role] = {};
    }
    if (!acc[permission.role]![permission.resource]) {
      acc[permission.role]![permission.resource] = [];
    }
    acc[permission.role]![permission.resource]!.push(permission);
    return acc;
  }, {} as Record<UserRole, Record<string, RolePermission[]>>);

  const roles = Object.keys(groupedPermissions) as UserRole[];
  const resources = Array.from(new Set(permissions.map(p => p.resource)));

  return (
    <Box>
      {/* Заголовок */}
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box mb={4}>
          <Typography variant="h5" fontWeight={600} mb={1}>
            Управление правами доступа
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Настройка прав доступа для различных ролей пользователей
          </Typography>
        </Box>
      </AnimatedContainer>

      {/* Ошибки */}
      {error && (
        <AnimatedContainer animation="slideUp" delay={150}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </AnimatedContainer>
      )}

      {/* Права по ролям */}
      <AnimatedContainer animation="slideUp" delay={200}>
        <Box display="flex" flexDirection="column" gap={2}>
          {roles.map((role, roleIndex) => (
            <Accordion key={role} defaultExpanded={roleIndex === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={roleLabels[role]}
                    color={roleColors[role]}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Object.keys(groupedPermissions[role]).length} ресурсов
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" flexDirection="column" gap={3}>
                  {resources.map((resource) => {
                    const resourcePermissions = groupedPermissions[role][resource] || [];
                    if (resourcePermissions.length === 0) return null;

                    return (
                      <Paper key={resource} variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          {getResourceIcon(resource)}
                          <Typography variant="subtitle2" fontWeight={600}>
                            {resourceLabels[resource] || resource}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" flexWrap="wrap" gap={2}>
                          {resourcePermissions.map((permission) => (
                            <FormControlLabel
                              key={permission.id}
                              control={
                                <Switch
                                  checked={permission.allowed}
                                  onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                  disabled={updatingPermissions.has(permission.id)}
                                  size="small"
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {actionLabels[permission.action] || permission.action}
                                </Typography>
                              }
                            />
                          ))}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </AnimatedContainer>

      {/* Матрица прав (альтернативное представление) */}
      <AnimatedContainer animation="slideUp" delay={300}>
        <Box mt={6}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Матрица прав доступа
          </Typography>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ресурс / Действие</TableCell>
                  {roles.map((role) => (
                    <TableCell key={role} align="center">
                      <Chip
                        label={roleLabels[role]}
                        color={roleColors[role]}
                        size="small"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resources.map((resource) => {
                  const actions = Array.from(
                    new Set(
                      permissions
                        .filter(p => p.resource === resource)
                        .map(p => p.action)
                    )
                  );

                  return actions.map((action, actionIndex) => (
                    <TableRow key={`${resource}-${action}`}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {actionIndex === 0 && getResourceIcon(resource)}
                          <Typography variant="body2">
                            {actionIndex === 0 && (resourceLabels[resource] || resource)} / {actionLabels[action] || action}
                          </Typography>
                        </Box>
                      </TableCell>
                      {roles.map((role) => {
                        const permission = permissions.find(
                          p => p.role === role && p.resource === resource && p.action === action
                        );
                        
                        return (
                          <TableCell key={role} align="center">
                            {permission ? (
                              <Switch
                                checked={permission.allowed}
                                onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                disabled={updatingPermissions.has(permission.id)}
                                size="small"
                              />
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </AnimatedContainer>

      {/* Описание ролей */}
      <AnimatedContainer animation="slideUp" delay={400}>
        <Box mt={6}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Описание ролей
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip label="Группа" color="default" size="small" />
                <Typography variant="subtitle2">Базовый уровень доступа</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Может просматривать каталог литературы, создавать заказы, просматривать свои отчеты.
                Ограниченный доступ только к данным своей группы.
              </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip label="Местный подкомитет" color="info" size="small" />
                <Typography variant="subtitle2">Расширенные права группы</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Аналогичные права с группой, но может управлять заказами нескольких групп
                в рамках своей местности.
              </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip label="Местность" color="warning" size="small" />
                <Typography variant="subtitle2">Управление местностью</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Может обрабатывать заказы от групп, управлять остатками на складе местности,
                создавать заказы у региона, просматривать отчеты по местности.
              </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip label="Регион" color="success" size="small" />
                <Typography variant="subtitle2">Региональное управление</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Полный доступ к управлению литературой, обработке заказов от местностей,
                управлению региональным складом, генерации отчетов по всему региону.
              </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip label="Администратор" color="error" size="small" />
                <Typography variant="subtitle2">Полный доступ к системе</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Управление пользователями, организациями, системными настройками,
                правами доступа. Полный доступ ко всем данным и функциям системы.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </AnimatedContainer>
    </Box>
  );
};