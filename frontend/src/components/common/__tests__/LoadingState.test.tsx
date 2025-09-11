import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import LoadingState, { 
  SkeletonLoader, 
  CardSkeleton, 
  TableSkeleton, 
  WithLoading 
} from '../LoadingState';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LoadingState Components', () => {
  describe('LoadingState', () => {
    it('should render circular loading by default', () => {
      renderWithTheme(<LoadingState />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      renderWithTheme(<LoadingState message="Сохранение данных..." />);
      
      expect(screen.getByText('Сохранение данных...')).toBeInTheDocument();
    });

    it('should render linear progress variant', () => {
      renderWithTheme(<LoadingState variant="linear" />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render in fullscreen mode', () => {
      renderWithTheme(<LoadingState fullScreen />);
      
      const container = screen.getByRole('progressbar').closest('div');
      expect(container).toHaveStyle({
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
      });
    });

    it('should render with overlay in fullscreen', () => {
      renderWithTheme(<LoadingState fullScreen overlay />);
      
      const container = screen.getByRole('progressbar').closest('div');
      expect(container).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      });
    });

    it('should render different sizes', () => {
      const { rerender } = renderWithTheme(<LoadingState size="small" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <LoadingState size="large" />
        </ThemeProvider>
      );
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('SkeletonLoader', () => {
    it('should render default number of skeleton rows', () => {
      renderWithTheme(<SkeletonLoader />);
      
      // По умолчанию должно быть 3 строки
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons).toHaveLength(3);
    });

    it('should render custom number of rows', () => {
      renderWithTheme(<SkeletonLoader rows={5} />);
      
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons).toHaveLength(5);
    });

    it('should render with custom height', () => {
      renderWithTheme(<SkeletonLoader height={100} />);
      
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render different variants', () => {
      const { rerender } = renderWithTheme(<SkeletonLoader variant="text" />);
      expect(screen.getAllByTestId(/skeleton/i)).toHaveLength(3);

      rerender(
        <ThemeProvider theme={theme}>
          <SkeletonLoader variant="circular" />
        </ThemeProvider>
      );
      expect(screen.getAllByTestId(/skeleton/i)).toHaveLength(3);
    });
  });

  describe('CardSkeleton', () => {
    it('should render card skeleton structure', () => {
      renderWithTheme(<CardSkeleton />);
      
      // Должны быть скелетоны для заголовка, текста и кнопки
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('TableSkeleton', () => {
    it('should render default table skeleton', () => {
      renderWithTheme(<TableSkeleton />);
      
      // По умолчанию 5 строк × 4 колонки = 20 скелетонов
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons).toHaveLength(20);
    });

    it('should render custom table dimensions', () => {
      renderWithTheme(<TableSkeleton rows={3} columns={2} />);
      
      // 3 строки × 2 колонки = 6 скелетонов
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons).toHaveLength(6);
    });
  });

  describe('WithLoading HOC', () => {
    const TestComponent = () => <div>Test Content</div>;

    it('should render children when not loading and no error', () => {
      renderWithTheme(
        <WithLoading loading={false} error={null}>
          <TestComponent />
        </WithLoading>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render loading state when loading', () => {
      renderWithTheme(
        <WithLoading loading={true} error={null}>
          <TestComponent />
        </WithLoading>
      );
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should render error state when error exists', () => {
      renderWithTheme(
        <WithLoading loading={false} error="Something went wrong">
          <TestComponent />
        </WithLoading>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should render custom loading component', () => {
      const CustomLoading = () => <div>Custom Loading...</div>;
      
      renderWithTheme(
        <WithLoading 
          loading={true} 
          error={null}
          loadingComponent={<CustomLoading />}
        >
          <TestComponent />
        </WithLoading>
      );
      
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should render custom error component', () => {
      const CustomError = () => <div>Custom Error Component</div>;
      
      renderWithTheme(
        <WithLoading 
          loading={false} 
          error="Error occurred"
          errorComponent={<CustomError />}
        >
          <TestComponent />
        </WithLoading>
      );
      
      expect(screen.getByText('Custom Error Component')).toBeInTheDocument();
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
    });

    it('should prioritize loading over error', () => {
      renderWithTheme(
        <WithLoading loading={true} error="Error message">
          <TestComponent />
        </WithLoading>
      );
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for loading state', () => {
      renderWithTheme(<LoadingState />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have proper text content for screen readers', () => {
      renderWithTheme(<LoadingState message="Загрузка данных" />);
      
      expect(screen.getByText('Загрузка данных')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should use theme colors and typography', () => {
      renderWithTheme(<LoadingState />);
      
      const message = screen.getByText('Загрузка...');
      expect(message).toBeInTheDocument();
      
      // Проверяем, что компонент рендерится без ошибок с темой
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});