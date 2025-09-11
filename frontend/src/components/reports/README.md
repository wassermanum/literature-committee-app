# Компоненты отчетности

Этот модуль содержит компоненты для генерации, просмотра и экспорта отчетов в системе литературного комитета.

## Компоненты

### ReportGenerator
Основной компонент для генерации отчетов с фильтрацией и экспортом.

**Возможности:**
- Выбор типа отчета (движение литературы, финансовый, остатки)
- Настройка периода отчета с быстрыми фильтрами
- Дополнительная фильтрация по организациям, литературе, категориям
- Генерация отчетов в реальном времени
- Экспорт в PDF, Excel и CSV форматы
- Интегрированный просмотр сгенерированных отчетов

**Использование:**
```tsx
import { ReportGenerator } from '../components/reports';

<ReportGenerator />
```

### ReportViewer
Компонент для отображения сгенерированных отчетов.

**Возможности:**
- Отображение различных типов отчетов с адаптивным интерфейсом
- Сводная информация с ключевыми показателями
- Табличное представление данных с сортировкой
- Цветовая индикация для финансовых показателей
- Детализация по организациям и литературе

**Пропсы:**
- `reportData: ReportData` - данные отчета для отображения

**Типы отчетов:**
1. **Движение литературы** - показывает все транзакции (поступления, отгрузки, корректировки)
2. **Финансовый отчет** - отображает доходы, расходы и прибыль по организациям
3. **Остатки на складах** - показывает текущие остатки литературы по всем складам

### ReportFilters
Компонент фильтрации для настройки параметров отчета.

**Возможности:**
- Выбор типа отчета из выпадающего списка
- Настройка периода с помощью календарей
- Быстрые фильтры периодов (текущий месяц, прошлый месяц, квартал, год)
- Дополнительные фильтры по организациям, литературе, категориям
- Отображение активных фильтров с возможностью быстрого удаления
- Сворачиваемый интерфейс для экономии места

**Пропсы:**
- `filters: ReportFilters` - текущие фильтры
- `organizations: Array<{id, name, type}>` - список организаций
- `literature: Array<{id, title, category}>` - список литературы
- `categories: string[]` - список категорий
- `onFiltersChange: (filters) => void` - колбэк изменения фильтров
- `loading?: boolean` - состояние загрузки

## Хуки

### useReports
Основной хук для работы с отчетами.

**Возможности:**
- Генерация отчетов по заданным фильтрам
- Экспорт отчетов в различные форматы
- Автоматическое скачивание экспортированных файлов
- Управление состоянием загрузки и ошибок
- Очистка данных отчета

**Методы:**
- `generateReport(filters)` - генерация отчета
- `exportReport(reportData, format, filename)` - экспорт отчета
- `clearReport()` - очистка данных отчета

**Состояние:**
- `reportData` - данные сгенерированного отчета
- `loading` - состояние генерации отчета
- `exporting` - состояние экспорта
- `error` - ошибки генерации/экспорта

### useReportFilters
Хук для загрузки данных для фильтров отчетов.

**Возможности:**
- Загрузка списка организаций
- Загрузка списка литературы
- Загрузка списка категорий
- Управление состоянием загрузки данных

**Методы:**
- `loadFilterData()` - загрузка всех данных для фильтров

**Состояние:**
- `organizations` - список организаций
- `literature` - список литературы
- `categories` - список категорий
- `loading` - состояние загрузки
- `error` - ошибки загрузки

## Типы данных

### ReportType
Перечисление типов отчетов:
```typescript
enum ReportType {
  MOVEMENT = 'movement',      // Движение литературы
  FINANCIAL = 'financial',   // Финансовый отчет
  INVENTORY = 'inventory',   // Остатки на складах
}
```

### ExportFormat
Форматы экспорта:
```typescript
enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}
```

### ReportFilters
Параметры фильтрации отчетов:
```typescript
interface ReportFilters {
  type: ReportType;
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  organizationId?: string;
  literatureId?: string;
  category?: string;
}
```

### ReportData
Структура данных отчета:
```typescript
interface ReportData {
  type: ReportType;
  filters: ReportFilters;
  generatedAt: string;
  data: MovementReportItem[] | FinancialReportItem[] | InventoryReportItem[];
  summary?: {
    totalItems: number;
    totalValue?: number;
    totalQuantity?: number;
    [key: string]: any;
  };
}
```

## Сервисы

### reportsService
Сервис для взаимодействия с API отчетов:

**Методы:**
- `generateReport(filters)` - генерация отчета
- `getMovementReport(filters)` - отчет по движению
- `getFinancialReport(filters)` - финансовый отчет
- `getInventoryReport(filters)` - отчет по остаткам
- `exportReport(exportRequest)` - экспорт отчета
- `downloadReport(downloadUrl)` - скачивание файла
- `getOrganizations()` - получение списка организаций
- `getLiteratureList()` - получение списка литературы
- `getCategories()` - получение списка категорий

## API эндпоинты

Компоненты работают со следующими API эндпоинтами:

```
GET  /api/reports/movement    # Отчет по движению литературы
GET  /api/reports/financial   # Финансовый отчет
GET  /api/reports/inventory   # Отчет по остаткам
POST /api/reports/export      # Экспорт отчета
GET  /api/organizations       # Список организаций
GET  /api/literature          # Список литературы
GET  /api/literature/categories # Список категорий
```

## Использование

### Базовое использование
```tsx
import { ReportGenerator } from '../components/reports';

function ReportsPage() {
  return (
    <div>
      <ReportGenerator />
    </div>
  );
}
```

### Кастомная интеграция
```tsx
import { useReports, ReportFilters, ReportViewer } from '../components/reports';

function CustomReports() {
  const { reportData, generateReport, loading } = useReports();
  
  const handleGenerate = async () => {
    const filters = {
      type: ReportType.MOVEMENT,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };
    await generateReport(filters);
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        Сгенерировать отчет
      </button>
      {reportData && <ReportViewer reportData={reportData} />}
    </div>
  );
}
```

## Особенности

1. **Адаптивный дизайн**: все компоненты адаптируются под различные размеры экрана
2. **Локализация**: поддержка русского языка для дат и форматирования
3. **Экспорт файлов**: автоматическое скачивание экспортированных отчетов
4. **Кэширование**: данные фильтров кэшируются для улучшения производительности
5. **Обработка ошибок**: централизованная обработка ошибок с пользовательскими уведомлениями
6. **Анимации**: плавные анимации появления элементов интерфейса

## Требования

- React 18+
- Material-UI 5+
- @mui/x-date-pickers для работы с датами
- date-fns для форматирования дат
- Поддержка современных браузеров с ES6+

## Права доступа

- **Просмотр отчетов**: все авторизованные пользователи
- **Экспорт отчетов**: все авторизованные пользователи
- **Доступ к данным**: в зависимости от роли пользователя (группа видит только свои данные, регион - все данные)