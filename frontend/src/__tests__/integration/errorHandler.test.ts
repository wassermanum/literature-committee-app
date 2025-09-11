import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import GlobalErrorHandler, { ErrorCode } from '@/utils/errorHandler';

// Мокаем react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const mockedToast = toast as any;

describe('Global Error Handler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокаем console.error чтобы не засорять вывод тестов
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Axios Error Handling', () => {
    it('should handle API errors with error codes', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            code: ErrorCode.INSUFFICIENT_INVENTORY,
            message: 'Not enough items in stock',
          },
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(axiosError);

      expect(mockedToast.error).toHaveBeenCalledWith('Недостаточно товара на складе');
    });

    it('should handle HTTP status codes without API error codes', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(axiosError);

      expect(mockedToast.error).toHaveBeenCalledWith('Ресурс не найден');
    });

    it('should handle network errors', () => {
      const networkError = {
        isAxiosError: true,
        code: 'NETWORK_ERROR',
        message: 'Network Error',
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(networkError);

      expect(mockedToast.error).toHaveBeenCalledWith('Ошибка сети. Проверьте подключение к интернету');
    });

    it('should handle timeout errors', () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout exceeded',
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(timeoutError);

      expect(mockedToast.error).toHaveBeenCalledWith('Превышено время ожидания запроса');
    });

    it('should handle validation errors (422)', () => {
      const validationError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
          },
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(validationError);

      expect(mockedToast.error).toHaveBeenCalledWith('Ошибка валидации данных');
    });

    it('should handle authorization errors (401)', () => {
      const authError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(authError);

      expect(mockedToast.error).toHaveBeenCalledWith('Необходима авторизация');
    });

    it('should handle forbidden errors (403)', () => {
      const forbiddenError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {},
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(forbiddenError);

      expect(mockedToast.error).toHaveBeenCalledWith('Доступ запрещен');
    });

    it('should handle server errors (500)', () => {
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(serverError);

      expect(mockedToast.error).toHaveBeenCalledWith('Внутренняя ошибка сервера');
    });
  });

  describe('Business Logic Error Codes', () => {
    it('should handle order locked error', () => {
      const orderLockedError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            code: ErrorCode.ORDER_LOCKED_FOR_EDITING,
            message: 'Order is locked',
          },
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(orderLockedError);

      expect(mockedToast.error).toHaveBeenCalledWith('Заказ заблокирован для редактирования');
    });

    it('should handle invalid status transition error', () => {
      const statusError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            code: ErrorCode.INVALID_STATUS_TRANSITION,
            message: 'Invalid status transition',
          },
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(statusError);

      expect(mockedToast.error).toHaveBeenCalledWith('Недопустимый переход статуса');
    });

    it('should handle organization hierarchy error', () => {
      const hierarchyError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            code: ErrorCode.ORGANIZATION_HIERARCHY_ERROR,
            message: 'Invalid organization hierarchy',
          },
        },
        config: {},
      } as AxiosError;

      GlobalErrorHandler.handleError(hierarchyError);

      expect(mockedToast.error).toHaveBeenCalledWith('Ошибка иерархии организаций');
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle generic JavaScript errors', () => {
      const genericError = new Error('Something went wrong');

      GlobalErrorHandler.handleError(genericError);

      expect(mockedToast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('should handle unknown errors', () => {
      const unknownError = 'Unknown error';

      GlobalErrorHandler.handleError(unknownError);

      expect(mockedToast.error).toHaveBeenCalledWith('Произошла неизвестная ошибка');
    });
  });

  describe('Success Notifications', () => {
    it('should show success message', () => {
      GlobalErrorHandler.showSuccess('Operation completed successfully');

      expect(mockedToast.success).toHaveBeenCalledWith('Operation completed successfully');
    });

    it('should show info message', () => {
      GlobalErrorHandler.showInfo('Information message');

      expect(mockedToast.info).toHaveBeenCalledWith('Information message');
    });

    it('should show warning message', () => {
      GlobalErrorHandler.showWarning('Warning message');

      expect(mockedToast.warning).toHaveBeenCalledWith('Warning message');
    });
  });

  describe('React Error Boundary', () => {
    it('should handle React errors', () => {
      const reactError = new Error('React component error');
      const errorInfo = { componentStack: 'Component stack trace' };

      // Мокаем console.error для React Error Boundary
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      GlobalErrorHandler.handleReactError(reactError, errorInfo);

      expect(consoleSpy).toHaveBeenCalledWith(
        'React Error Boundary caught an error:',
        reactError,
        errorInfo
      );
      expect(mockedToast.error).toHaveBeenCalledWith(
        'Произошла ошибка в приложении. Страница будет перезагружена.'
      );

      consoleSpy.mockRestore();
    });
  });
});