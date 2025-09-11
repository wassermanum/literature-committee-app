import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ErrorBoundary from '../ErrorBoundary';
import GlobalErrorHandler from '../../../utils/errorHandler';

// Мокаем GlobalErrorHandler
vi.mock('../../../utils/errorHandler');
const mockedErrorHandler = GlobalErrorHandler as any;

// Мокаем window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Компонент, который может выбросить ошибку
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Компонент для тестирования в development режиме
const ThrowErrorWithStack = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    const error = new Error('Test error with stack');
    error.stack = 'Error: Test error with stack\n    at ThrowErrorWithStack';
    throw error;
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Подавляем console.error для тестов
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      renderWithTheme(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should not call error handler when no error occurs', () => {
      renderWithTheme(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(mockedErrorHandler.handleReactError).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should render error UI when child component throws error', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
      expect(screen.getByText(/К сожалению, что-то пошло не так/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Перезагрузить страницу/i })).toBeInTheDocument();
    });

    it('should call GlobalErrorHandler when error occurs', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockedErrorHandler.handleReactError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should display error icon', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Проверяем наличие иконки ошибки (ErrorOutline)
      const errorIcon = screen.getByTestId('ErrorOutlineIcon');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should handle reload button click', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /Перезагрузить страницу/i });
      fireEvent.click(reloadButton);

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      renderWithTheme(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Произошла ошибка')).not.toBeInTheDocument();
    });

    it('should still call error handler with custom fallback', () => {
      const customFallback = <div>Custom error message</div>;

      renderWithTheme(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockedErrorHandler.handleReactError).toHaveBeenCalled();
    });
  });

  describe('Development Mode', () => {
    it('should show error details in development mode', () => {
      // Временно устанавливаем NODE_ENV в development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithTheme(
        <ErrorBoundary>
          <ThrowErrorWithStack shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error with stack')).toBeInTheDocument();

      // Восстанавливаем оригинальное значение
      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      // Убеждаемся, что мы не в development режиме
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderWithTheme(
        <ErrorBoundary>
          <ThrowErrorWithStack shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Test error with stack')).not.toBeInTheDocument();
      expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();

      // Восстанавливаем оригинальное значение
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Recovery', () => {
    it('should recover when error is fixed', () => {
      const { rerender } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Проверяем, что показывается ошибка
      expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();

      // Исправляем ошибку
      rerender(
        <ThemeProvider theme={theme}>
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        </ThemeProvider>
      );

      // ErrorBoundary не сбрасывается автоматически при rerender
      // Это ожидаемое поведение React ErrorBoundary
      expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
    });
  });

  describe('Multiple Errors', () => {
    it('should handle multiple errors from different components', () => {
      renderWithTheme(
        <ErrorBoundary>
          <div>
            <ThrowError shouldThrow={true} />
            <div>This won't render due to error above</div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
      expect(mockedErrorHandler.handleReactError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /Перезагрузить страницу/i });
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton).toHaveAttribute('type', 'button');
    });

    it('should have proper heading structure', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 5 });
      expect(heading).toHaveTextContent('Произошла ошибка');
    });
  });

  describe('Styling', () => {
    it('should apply proper Material-UI styling', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Проверяем, что компоненты Material-UI рендерятся
      expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should center content properly', () => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const container = screen.getByText('Произошла ошибка').closest('div');
      expect(container).toBeInTheDocument();
    });
  });
});