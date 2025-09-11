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
  TextField,
  Switch,
  // IconButton, // Unused import
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Save,
  Refresh,
  Settings,
  Security,
  Notifications,
  Storage,
  Email,
  Info,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { SystemSettings as SettingsType } from '../../types';
import { useSystemSettings } from '../../hooks/useAdmin';
import { AnimatedContainer } from '../ui';

const categoryIcons: Record<string, React.ReactElement> = {
  general: <Settings fontSize="small" />,
  security: <Security fontSize="small" />,
  notifications: <Notifications fontSize="small" />,
  storage: <Storage fontSize="small" />,
  email: <Email fontSize="small" />,
};

const categoryLabels: Record<string, string> = {
  general: 'Общие настройки',
  security: 'Безопасность',
  notifications: 'Уведомления',
  storage: 'Хранилище',
  email: 'Email',
};

export const SystemSettings: React.FC = () => {
  const { settings, loading, error, updateSetting, refetch } = useSystemSettings();
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState<Set<string>>(new Set());

  const handleSettingChange = (key: string, value: string) => {
    setEditingSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSetting = async (setting: SettingsType) => {
    const newValue = editingSettings[setting.key] ?? setting.value;
    
    try {
      setSavingSettings(prev => new Set(prev).add(setting.key));
      await updateSetting(setting.key, { value: newValue });
      
      // Удаляем из редактируемых после успешного сохранения
      setEditingSettings(prev => {
        const newState = { ...prev };
        delete newState[setting.key];
        return newState;
      });
    } catch (err) {
      // Ошибка уже обработана в хуке
    } finally {
      setSavingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(setting.key);
        return newSet;
      });
    }
  };

  const renderSettingInput = (setting: SettingsType) => {
    const currentValue = editingSettings[setting.key] ?? setting.value;
    const hasChanges = editingSettings[setting.key] !== undefined && 
                      editingSettings[setting.key] !== setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={currentValue === 'true'}
                  onChange={(e) => handleSettingChange(setting.key, e.target.checked.toString())}
                  disabled={!setting.isEditable}
                />
              }
              label=""
            />
            {hasChanges && (
              <LoadingButton
                size="small"
                onClick={() => handleSaveSetting(setting)}
                loading={savingSettings.has(setting.key)}
                startIcon={<Save />}
                variant="outlined"
              >
                Сохранить
              </LoadingButton>
            )}
          </Box>
        );

      case 'number':
        return (
          <TextField
            size="small"
            type="number"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            disabled={!setting.isEditable}
            InputProps={{
              endAdornment: hasChanges && (
                <InputAdornment position="end">
                  <LoadingButton
                    size="small"
                    onClick={() => handleSaveSetting(setting)}
                    loading={savingSettings.has(setting.key)}
                  >
                    <Save fontSize="small" />
                  </LoadingButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
        );

      case 'json':
        return (
          <Box display="flex" flexDirection="column" gap={1}>
            <TextField
              multiline
              rows={4}
              value={currentValue}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              disabled={!setting.isEditable}
              sx={{ minWidth: 400 }}
              placeholder="JSON объект"
            />
            {hasChanges && (
              <Box>
                <LoadingButton
                  size="small"
                  onClick={() => handleSaveSetting(setting)}
                  loading={savingSettings.has(setting.key)}
                  startIcon={<Save />}
                  variant="outlined"
                >
                  Сохранить
                </LoadingButton>
              </Box>
            )}
          </Box>
        );

      default: // string
        return (
          <TextField
            size="small"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            disabled={!setting.isEditable}
            InputProps={{
              endAdornment: hasChanges && (
                <InputAdornment position="end">
                  <LoadingButton
                    size="small"
                    onClick={() => handleSaveSetting(setting)}
                    loading={savingSettings.has(setting.key)}
                  >
                    <Save fontSize="small" />
                  </LoadingButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
        );
    }
  };

  // Группируем настройки по категориям
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category]!.push(setting);
    return acc;
  }, {} as Record<string, SettingsType[]>);

  const categories = Object.keys(groupedSettings);

  return (
    <Box>
      {/* Заголовок */}
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h5" fontWeight={600} mb={1}>
              Системные настройки
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Конфигурация параметров системы
            </Typography>
          </Box>
          <LoadingButton
            startIcon={<Refresh />}
            onClick={refetch}
            loading={loading}
            variant="outlined"
          >
            Обновить
          </LoadingButton>
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

      {/* Предупреждение */}
      <AnimatedContainer animation="slideUp" delay={200}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Будьте осторожны при изменении системных настроек. 
            Неправильные значения могут нарушить работу системы.
          </Typography>
        </Alert>
      </AnimatedContainer>

      {/* Настройки по категориям */}
      <AnimatedContainer animation="slideUp" delay={250}>
        <Box display="flex" flexDirection="column" gap={2}>
          {categories.map((category, categoryIndex) => (
            <Accordion key={category} defaultExpanded={categoryIndex === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  {categoryIcons[category] || <Settings fontSize="small" />}
                  <Typography variant="h6">
                    {categoryLabels[category] || category}
                  </Typography>
                  <Chip
                    label={`${groupedSettings[category]?.length || 0} настроек`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Параметр</TableCell>
                        <TableCell>Описание</TableCell>
                        <TableCell>Значение</TableCell>
                        <TableCell>Тип</TableCell>
                        <TableCell>Обновлено</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(groupedSettings[category] || []).map((setting) => (
                        <TableRow key={setting.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight={600}>
                                {setting.key}
                              </Typography>
                              {!setting.isEditable && (
                                <Tooltip title="Только для чтения">
                                  <Info fontSize="small" color="disabled" />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {setting.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {renderSettingInput(setting)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={setting.type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" display="block">
                                {format(new Date(setting.updatedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {setting.updatedBy}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </AnimatedContainer>

      {/* Информация о типах данных */}
      <AnimatedContainer animation="slideUp" delay={300}>
        <Box mt={4}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Типы данных
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2">
                <strong>string</strong> - Текстовое значение
              </Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2">
                <strong>number</strong> - Числовое значение
              </Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2">
                <strong>boolean</strong> - Логическое значение (true/false)
              </Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2">
                <strong>json</strong> - JSON объект для сложных конфигураций
              </Typography>
            </Paper>
          </Box>
        </Box>
      </AnimatedContainer>
    </Box>
  );
};