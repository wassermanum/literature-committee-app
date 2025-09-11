import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiError } from '@/services/httpClient';

// Коды ошибок согласно дизайну
export enum ErrorCode {
  // Аутентификация
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  INVALID_CREDENTIALS = 'AUTH_003',
  
  // Валидация
  VALIDATION_ERROR = 'VAL_001',
  REQUIRED_FIELD = 'VAL_002',
  INVALID_FORMAT = 'VAL_003',
  
  // Бизнес-логика
  INSUFFICIENT_INVENTORY = 'BIZ_001',
  INVALID_ORDER_STATUS = 'BIZ_002',
  ORGANIZATION_HIERARCHY_ERROR = 'BIZ_003',
  ORDER_LOCKED_FOR_EDITING = 'BIZ_004',
  INVALID_STATUS_TRANSITION = 'BIZ_005',
  
  // Система
  DATABASE_ERROR = 'SYS_001',
  EXTERNAL_SERVICE_ERROR = 'SYS_002',
  INTERNAL_SERVER_ERROR = 'SYS_003'
}

// Сообщения об ошибках на русском языке
const errorMessages: Record<string, string> = {
  [ErrorCode.UNAUTHORIZED]: 'Необходима авторизация',
  [ErrorCode.FORBIDDEN]: 'Недостаточно прав доступа',
  [ErrorCode.INVALID_CREDENTIALS]: 'Неверные учетные данные',
  
  [ErrorCode.VALIDATION_ERROR]: 'Ошибка валидации данных',
  [ErrorCode.REQUIRED_FIELD]: 'Обязательное поле не заполнено',
  [ErrorCode.INVALID_FORMAT]: 'Неверный формат данных',
  
  [ErrorCode.INSUFFICIENT_INVENTORY]: 'Недостаточно товара на складе',
  [ErrorCode.INVALID_ORDER_STATUS]: 'Недопустимый статус заказа',
  [ErrorCode.ORGANIZATION_HIERARCHY_ERROR]: 'Ошибка иерархии организаций',
  [ErrorCode.ORDER_LOCKED_FOR_EDITING]: 'Заказ заблокирован для редактирования',
  [ErrorCode.INVALID_STATUS_TRANSITION]: 'Недопустимый переход статуса',
  
  [ErrorCode.DATABASE_ERROR]: 'Ошибка базы данных',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Ошибка внешнего сервиса',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Внутренняя ошибка сервера'
};

// Глобальный обработчик ошибок
export class GlobalErrorHandler {
  static handleError(error: unknown, context?: string): void {
    console.error('Error occurred:', error, 'Context:', context);

    if (error instanceof AxiosError) {
      this.handleAxiosError(error);
    } else if (error instanceof Error) {
      this.handleGenericError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  private static handleAxiosError(error: AxiosError): void {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.code && errorMessages[apiError.code]) {
      toast.error(errorMessages[apiError.code]);
    } else if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          toast.error('Неверный запрос');
          break;
        case 401:
          toast.error('Необходима авторизация');
          break;
        case 403:
          toast.error('Доступ запрещен');
          break;
        case 404:
          toast.error('Ресурс не найден');
          break;
        case 422:
          toast.error('Ошибка валидации данных');
          break;
        case 500:
          toast.error('Внутренняя ошибка сервера');
          break;
        default:
          toast.error(`Ошибка сервера: ${error.response.status}`);
      }
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Ошибка сети. Проверьте подключение к интернету');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Превышено время ожидания запроса');
    } else {
      toast.error('Произошла ошибка при выполнении запроса');
    }
  }

  private static handleGenericError(error: Error): void {
    toast.error(error.message || 'Произошла неожиданная ошибка');
  }

  private static handleUnknownError(error: unknown): void {
    toast.error('Произошла неизвестная ошибка');
  }

  // Обработчик для React Error Boundary
  static handleReactError(error: Error, errorInfo: any): void {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    toast.error('Произошла ошибка в приложении. Страница будет перезагружена.');
    
    // Можно добавить отправку ошибки в систему мониторинга
    // this.sendErrorToMonitoring(error, errorInfo);
  }

  // Метод для отправки успешных уведомлений
  static showSuccess(message: string): void {
    toast.success(message);
  }

  // Метод для отправки информационных уведомлений
  static showInfo(message: string): void {
    toast.info(message);
  }

  // Метод для отправки предупреждений
  static showWarning(message: string): void {
    toast.warning(message);
  }
}

export default GlobalErrorHandler;