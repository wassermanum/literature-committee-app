import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Save, Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  CreateLiteratureRequest,
  UpdateLiteratureRequest,
  // LiteratureWithInventory, // Unused import
} from '@/types';
import { literatureService } from '@/services';
import { useLiteratureItem } from '@/hooks/useLiterature';
import { GradientButton } from '@/components/ui';

interface LiteratureFormProps {
  open: boolean;
  literatureId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Название обязательно')
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: Yup.string()
    .required('Описание обязательно')
    .min(10, 'Описание должно содержать минимум 10 символов')
    .max(1000, 'Описание не должно превышать 1000 символов'),
  category: Yup.string()
    .required('Категория обязательна')
    .max(100, 'Категория не должна превышать 100 символов'),
  price: Yup.number()
    .required('Цена обязательна')
    .min(0, 'Цена не может быть отрицательной')
    .max(999999, 'Цена не должна превышать 999,999 рублей'),
});

const commonCategories = [
  'Базовая литература',
  'Истории выздоровления',
  'Медитации',
  'Служение',
  'Информационные материалы',
  'Рабочие тетради',
  'Брошюры',
  'Буклеты',
];

export const LiteratureForm: React.FC<LiteratureFormProps> = ({
  open,
  literatureId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState(false);

  const isEditing = Boolean(literatureId);
  const { literature, loading: fetchLoading } = useLiteratureItem(literatureId || '');

  const formik = useFormik<CreateLiteratureRequest & { isActive?: boolean }>({
    initialValues: {
      title: '',
      description: '',
      category: '',
      price: 0,
      isActive: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        if (isEditing && literatureId) {
          const updateData: UpdateLiteratureRequest = {
            title: values.title,
            description: values.description,
            category: values.category,
            price: values.price,
            isActive: values.isActive,
          };
          await literatureService.updateLiterature(literatureId, updateData);
        } else {
          const createData: CreateLiteratureRequest = {
            title: values.title,
            description: values.description,
            category: values.category,
            price: values.price,
          };
          await literatureService.createLiterature(createData);
        }

        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    },
  });

  // Заполняем форму данными при редактировании
  useEffect(() => {
    if (literature && isEditing) {
      formik.setValues({
        title: literature.title,
        description: literature.description,
        category: literature.category,
        price: literature.price,
        isActive: literature.isActive,
      });

      // Проверяем, является ли категория кастомной
      if (!commonCategories.includes(literature.category)) {
        setCustomCategory(true);
      }
    } else if (!isEditing) {
      formik.resetForm();
      setCustomCategory(false);
    }
  }, [literature, isEditing]);

  const handleClose = () => {
    formik.resetForm();
    setError(null);
    setCustomCategory(false);
    onClose();
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setCustomCategory(true);
      formik.setFieldValue('category', '');
    } else {
      setCustomCategory(false);
      formik.setFieldValue('category', value);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {isEditing ? 'Редактировать литературу' : 'Добавить литературу'}
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {fetchLoading && isEditing ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={3}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Название */}
              <TextField
                fullWidth
                label="Название"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                placeholder="Введите название литературы"
              />

              {/* Описание */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Описание"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                placeholder="Введите описание литературы"
              />

              {/* Категория */}
              <FormControl
                fullWidth
                error={formik.touched.category && Boolean(formik.errors.category)}
              >
                <InputLabel>Категория</InputLabel>
                <Select
                  value={customCategory ? 'custom' : formik.values.category}
                  label="Категория"
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {commonCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                  <MenuItem value="custom">Другая категория...</MenuItem>
                </Select>
                {formik.touched.category && formik.errors.category && (
                  <Box color="error.main" fontSize="0.75rem" mt={0.5} ml={1.75}>
                    {formik.errors.category}
                  </Box>
                )}
              </FormControl>

              {/* Кастомная категория */}
              {customCategory && (
                <TextField
                  fullWidth
                  label="Название категории"
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.category && Boolean(formik.errors.category)}
                  helperText={formik.touched.category && formik.errors.category}
                  placeholder="Введите название категории"
                />
              )}

              {/* Цена */}
              <TextField
                fullWidth
                type="number"
                label="Цена"
                name="price"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.price && Boolean(formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 0.01,
                }}
              />

              {/* Активность (только при редактировании) */}
              {isEditing && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.isActive}
                      onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                    />
                  }
                  label="Активная литература"
                />
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <GradientButton
            onClick={handleClose}
            gradient="secondary"
            startIcon={<Close />}
          >
            Отмена
          </GradientButton>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingPosition="start"
            startIcon={<Save />}
            variant="contained"
            disabled={!formik.isValid || fetchLoading}
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              '&:hover': {
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              },
            }}
          >
            {isEditing ? 'Сохранить' : 'Создать'}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};