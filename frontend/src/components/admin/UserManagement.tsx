import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
  // Tooltip, // Unused import
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  LockReset,
  // PersonOff, // Unused import
  // PersonAdd, // Unused import
  Download,
  Upload,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  User,
  UserRole,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  Organization,
} from '../../types';
import { useUsers } from '../../hooks/useAdmin';
import { AnimatedContainer, GradientButton } from '../ui';

interface UserManagementProps {
  organizations: Organization[];
}

const userRoleLabels = {
  [UserRole.GROUP]: 'Группа',
  [UserRole.LOCAL_SUBCOMMITTEE]: 'Местный подкомитет',
  [UserRole.LOCALITY]: 'Местность',
  [UserRole.REGION]: 'Регион',
  [UserRole.ADMIN]: 'Администратор',
};

const userRoleColors = {
  [UserRole.GROUP]: 'default',
  [UserRole.LOCAL_SUBCOMMITTEE]: 'info',
  [UserRole.LOCALITY]: 'warning',
  [UserRole.REGION]: 'success',
  [UserRole.ADMIN]: 'error',
} as const;

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Некорректный email')
    .required('Email обязателен'),
  firstName: Yup.string()
    .required('Имя обязательно')
    .min(2, 'Минимум 2 символа'),
  lastName: Yup.string()
    .required('Фамилия обязательна')
    .min(2, 'Минимум 2 символа'),
  role: Yup.string()
    .required('Роль обязательна'),
  organizationId: Yup.string()
    .required('Организация обязательна'),
  password: Yup.string()
    .min(6, 'Минимум 6 символов')
    .when('isEditing', {
      is: false,
      then: (schema) => schema.required('Пароль обязателен'),
    }),
});

export const UserManagement: React.FC<UserManagementProps> = ({ organizations }) => {
  const {
    users,
    total,
    page,
    error,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    updateFilters,
    updatePage,
  } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userForPassword, setUserForPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Фильтры
  const [filters, setFilters] = useState<UserFilters>({});

  const formik = useFormik<CreateUserRequest & { isEditing?: boolean }>({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: UserRole.GROUP,
      organizationId: '',
      password: '',
      isEditing: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setActionLoading(true);
        if (editingUser) {
          const updateData: UpdateUserRequest = {
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role,
            organizationId: values.organizationId,
          };
          await updateUser(editingUser.id, updateData);
        } else {
          await createUser({
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role,
            organizationId: values.organizationId,
            password: values.password,
          });
        }
        handleCloseForm();
      } catch (err) {
        // Ошибка уже обработана в хуке
      } finally {
        setActionLoading(false);
      }
    },
  });

  const handleAddUser = () => {
    setEditingUser(null);
    formik.resetForm();
    formik.setFieldValue('isEditing', false);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    formik.setValues({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      password: '',
      isEditing: true,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    formik.resetForm();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setActionLoading(true);
      await deleteUser(userToDelete.id);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err) {
      // Ошибка уже обработана в хуке
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userForPassword || !newPassword) return;

    try {
      setActionLoading(true);
      await resetPassword(userForPassword.id, newPassword);
      setShowPasswordDialog(false);
      setUserForPassword(null);
      setNewPassword('');
    } catch (err) {
      // Ошибка уже обработана в хуке
    } finally {
      setActionLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const getOrganizationName = (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    return org ? org.name : 'Неизвестно';
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <Box>
      {/* Заголовок и действия */}
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" fontWeight={600}>
            Управление пользователями
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              startIcon={<Download />}
              variant="outlined"
              onClick={() => {/* TODO: Экспорт */}}
            >
              Экспорт
            </Button>
            <Button
              startIcon={<Upload />}
              variant="outlined"
              onClick={() => {/* TODO: Импорт */}}
            >
              Импорт
            </Button>
            <GradientButton
              startIcon={<Add />}
              onClick={handleAddUser}
            >
              Добавить пользователя
            </GradientButton>
          </Box>
        </Box>
      </AnimatedContainer>

      {/* Фильтры */}
      <AnimatedContainer animation="slideUp" delay={200}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Поиск по имени или email..."
              value={filters.search || ''}
              onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Роль</InputLabel>
              <Select
                value={filters.role || ''}
                label="Роль"
                onChange={(e) => handleFiltersChange({ ...filters, role: e.target.value as UserRole })}
              >
                <MenuItem value="">Все роли</MenuItem>
                {Object.entries(userRoleLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Организация</InputLabel>
              <Select
                value={filters.organizationId || ''}
                label="Организация"
                onChange={(e) => handleFiltersChange({ ...filters, organizationId: e.target.value })}
              >
                <MenuItem value="">Все организации</MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </AnimatedContainer>

      {/* Ошибки */}
      {error && (
        <AnimatedContainer animation="slideUp" delay={250}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </AnimatedContainer>
      )}

      {/* Таблица пользователей */}
      <AnimatedContainer animation="slideUp" delay={300}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Пользователь</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Организация</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Создан</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {user.firstName} {user.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={userRoleLabels[user.role]}
                      color={userRoleColors[user.role]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{getOrganizationName(user.organizationId)}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Активен' : 'Неактивен'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, user)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AnimatedContainer>

      {/* Пагинация */}
      {totalPages > 1 && (
        <AnimatedContainer animation="slideUp" delay={400}>
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => updatePage(newPage)}
              color="primary"
            />
          </Box>
        </AnimatedContainer>
      )}

      {/* Меню действий */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedUser) handleEditUser(selectedUser);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редактировать</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setUserForPassword(selectedUser);
          setShowPasswordDialog(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <LockReset fontSize="small" />
          </ListItemIcon>
          <ListItemText>Сбросить пароль</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setUserToDelete(selectedUser);
          setShowDeleteDialog(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Удалить</ListItemText>
        </MenuItem>
      </Menu>

      {/* Форма создания/редактирования */}
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={3}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Имя"
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                />
                <TextField
                  fullWidth
                  label="Фамилия"
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              </Box>
              <FormControl fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                <InputLabel>Роль</InputLabel>
                <Select
                  name="role"
                  value={formik.values.role}
                  label="Роль"
                  onChange={formik.handleChange}
                >
                  {Object.entries(userRoleLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth error={formik.touched.organizationId && Boolean(formik.errors.organizationId)}>
                <InputLabel>Организация</InputLabel>
                <Select
                  name="organizationId"
                  value={formik.values.organizationId}
                  label="Организация"
                  onChange={formik.handleChange}
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!editingUser && (
                <TextField
                  fullWidth
                  label="Пароль"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Отмена</Button>
            <LoadingButton
              type="submit"
              loading={actionLoading}
              variant="contained"
            >
              {editingUser ? 'Сохранить' : 'Создать'}
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Удалить пользователя</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить пользователя{' '}
            <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Отмена</Button>
          <LoadingButton
            onClick={handleDeleteUser}
            loading={actionLoading}
            color="error"
            variant="contained"
          >
            Удалить
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Диалог сброса пароля */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
        <DialogTitle>Сбросить пароль</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Сброс пароля для пользователя{' '}
            <strong>{userForPassword?.firstName} {userForPassword?.lastName}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Новый пароль"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Минимум 6 символов"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Отмена</Button>
          <LoadingButton
            onClick={handleResetPassword}
            loading={actionLoading}
            variant="contained"
            disabled={newPassword.length < 6}
          >
            Сбросить пароль
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};