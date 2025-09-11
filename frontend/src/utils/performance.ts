// Утилиты для мониторинга производительности

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    this.initializeObservers();
  }

  // Инициализация наблюдателей производительности
  private initializeObservers() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    try {
      // Наблюдатель за навигацией
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.logNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Наблюдатель за ресурсами
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.logResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Наблюдатель за пользовательскими метриками
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`Custom Metric: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);

    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  // Логирование метрик навигации
  private logNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
    };

    console.group('Navigation Performance Metrics');
    console.log('DOM Content Loaded:', metrics.domContentLoaded + 'ms');
    console.log('Load Complete:', metrics.loadComplete + 'ms');
    console.log('DOM Interactive:', metrics.domInteractive + 'ms');
    console.log('First Paint:', metrics.firstPaint + 'ms');
    console.log('First Contentful Paint:', metrics.firstContentfulPaint + 'ms');
    console.groupEnd();
  }

  // Логирование метрик ресурсов
  private logResourceMetrics(entry: PerformanceResourceTiming) {
    if (entry.duration > 1000) { // Логируем только медленные ресурсы
      console.warn(`Slow Resource: ${entry.name} - ${entry.duration}ms`);
    }
  }

  // Получение времени первой отрисовки
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  // Получение времени первой содержательной отрисовки
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  // Начало измерения производительности
  startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
    performance.mark(`${name}-start`);
  }

  // Завершение измерения производительности
  endMeasure(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    // Логируем медленные операции
    if (duration > 100) {
      console.warn(`Slow Operation: ${name} - ${duration.toFixed(2)}ms`, metric.metadata);
    }

    return duration;
  }

  // Измерение функции
  measureFunction<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.startMeasure(name, metadata);
    try {
      const result = fn();
      return result;
    } finally {
      this.endMeasure(name);
    }
  }

  // Измерение асинхронной функции
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endMeasure(name);
    }
  }

  // Получение информации о памяти
  getMemoryInfo(): MemoryInfo | null {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  // Логирование использования памяти
  logMemoryUsage(): void {
    const memoryInfo = this.getMemoryInfo();
    if (memoryInfo) {
      const usedMB = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

      console.group('Memory Usage');
      console.log(`Used: ${usedMB} MB`);
      console.log(`Total: ${totalMB} MB`);
      console.log(`Limit: ${limitMB} MB`);
      console.log(`Usage: ${((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(2)}%`);
      console.groupEnd();
    }
  }

  // Получение всех метрик
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Очистка метрик
  clearMetrics(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  // Отключение мониторинга
  disable(): void {
    this.isEnabled = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Включение мониторинга
  enable(): void {
    this.isEnabled = true;
    this.initializeObservers();
  }
}

// Создаем глобальный экземпляр
export const performanceMonitor = new PerformanceMonitor();

// Декоратор для измерения производительности методов
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureFunction(
        measureName,
        () => originalMethod.apply(this, args),
        { args: args.length }
      );
    };

    return descriptor;
  };
}

// Декоратор для измерения производительности асинхронных методов
export function measureAsyncPerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsync(
        measureName,
        () => originalMethod.apply(this, args),
        { args: args.length }
      );
    };

    return descriptor;
  };
}

// Хук для мониторинга производительности React компонентов
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    performanceMonitor.startMeasure(`${componentName}-mount`);
    
    return () => {
      performanceMonitor.endMeasure(`${componentName}-mount`);
    };
  }, [componentName]);

  const measureRender = React.useCallback((renderName: string = 'render') => {
    performanceMonitor.startMeasure(`${componentName}-${renderName}`);
    
    return () => {
      performanceMonitor.endMeasure(`${componentName}-${renderName}`);
    };
  }, [componentName]);

  return { measureRender };
};

// Утилиты для измерения производительности API запросов
export const apiPerformance = {
  measureRequest: async <T>(
    url: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.measureAsync(
      `API-${url}`,
      requestFn,
      { url }
    );
  },

  measureQuery: <T>(
    queryKey: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.measureAsync(
      `Query-${queryKey}`,
      queryFn,
      { queryKey }
    );
  },
};

// Утилиты для оптимизации производительности
export const performanceUtils = {
  // Дебаунс функции
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Троттлинг функции
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Мемоизация функции
  memoize: <T extends (...args: any[]) => any>(
    func: T,
    getKey?: (...args: Parameters<T>) => string
  ): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Ленивая загрузка компонентов
  lazyLoad: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> => {
    return React.lazy(() => 
      performanceMonitor.measureAsync(
        'LazyLoad-Component',
        importFunc
      )
    );
  },
};

export default performanceMonitor;