// React import removed - not needed in React 17+ with new JSX transform
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VirtualizedList } from '@/components/common/VirtualizedList';

// Мокаем react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => 
        children({ index, style: { height: itemSize } })
      )}
    </div>
  ),
  VariableSizeList: ({ children, itemCount }: any) => (
    <div data-testid="virtualized-variable-list">
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => 
        children({ index, style: { height: 50 } })
      )}
    </div>
  ),
}));

describe('Virtualization Performance Tests', () => {
  const generateLargeDataset = (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i}`,
    }));
  };

  describe('VirtualizedList', () => {
    it('should render large lists efficiently', () => {
      const items = generateLargeDataset(10000);
      
      const renderItem = ({ index, style, data }: any) => (
        <div key={index} style={style}>
          {data[index].name}
        </div>
      );

      const startTime = performance.now();
      
      render(
        <VirtualizedList
          items={items}
          height={400}
          itemHeight={50}
          renderItem={renderItem}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(100); // Рендер должен быть быстрым
    });
  });
});