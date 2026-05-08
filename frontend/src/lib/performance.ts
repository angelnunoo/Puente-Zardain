// Performance monitoring utilities
export interface PerformanceMetrics {
  renderTime: number;
  componentLoadTime: number;
  apiResponseTime: number;
  errorCount: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  startRender(componentName: string) {
    return {
      end: (renderTime: number) => {
        this.addMetric({
          renderTime,
          componentLoadTime: renderTime,
          apiResponseTime: 0,
          errorCount: 0,
        });
      }
    };
  }

  startApiCall(apiName: string) {
    const startTime = performance.now();
    return {
      end: (responseTime: number) => {
        this.addMetric({
          renderTime: 0,
          componentLoadTime: 0,
          apiResponseTime: responseTime - startTime,
          errorCount: 0,
        });
      }
    };
  }

  recordError() {
    const lastMetric = this.metrics[this.metrics.length - 1];
    if (lastMetric) {
      lastMetric.errorCount++;
    }
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageRenderTime(): number {
    const renderMetrics = this.metrics.filter(m => m.renderTime > 0);
    if (renderMetrics.length === 0) return 0;
    return renderMetrics.reduce((sum, m) => sum + m.renderTime, 0) / renderMetrics.length;
  }

  getAverageApiResponseTime(): number {
    const apiMetrics = this.metrics.filter(m => m.apiResponseTime > 0);
    if (apiMetrics.length === 0) return 0;
    return apiMetrics.reduce((sum, m) => sum + m.apiResponseTime, 0) / apiMetrics.length;
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    const totalErrors = this.metrics.reduce((sum, m) => sum + m.errorCount, 0);
    return totalErrors / this.metrics.length;
  }

  // Memory usage monitoring
  getMemoryUsage(): number | null {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return null;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance hooks for React components
export const usePerformance = (componentName: string) => {
  React.useEffect(() => {
    const endRender = performanceMonitor.startRender(componentName);
    
    // Simulate render completion
    setTimeout(() => {
      endRender(performance.now());
    }, 0);
  }, [componentName]);
};

// Performance optimization utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Lazy loading utility
export const lazyLoad = <T>(
  importer: () => Promise<T>
): () => Promise<T> => {
  let module: T | null = null;
  let isLoading = false;

  return async (): Promise<T> => {
    if (module) return module;
    if (isLoading) {
      // Wait for current load to complete
      while (isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return module as T;
    }

    isLoading = true;
    try {
      module = await importer();
      return module;
    } finally {
      isLoading = false;
    }
  };
};
