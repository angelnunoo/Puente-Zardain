import { useEffect, useCallback, useState } from 'react';

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: false,
    screenReader: false
  });

  // Detectar preferencias del sistema
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      largeText: window.matchMedia('(min-resolution: 120dpi)'),
    };

    const updateSettings = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        largeText: mediaQueries.largeText.matches,
      }));
    };

    // Actualizar configuración inicial
    updateSettings();

    // Escuchar cambios en las preferencias
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updateSettings);
    });

    // Detectar si se está usando lector de pantalla
    const detectScreenReader = () => {
      const hasAriaLive = document.querySelector('[aria-live]') !== null;
      const hasAriaLabel = document.querySelector('[aria-label]') !== null;
      const hasAriaDescribedBy = document.querySelector('[aria-describedby]') !== null;
      
      setSettings(prev => ({
        ...prev,
        screenReader: hasAriaLive || hasAriaLabel || hasAriaDescribedBy
      }));
    };

    detectScreenReader();

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updateSettings);
      });
    };
  }, []);

  // Manejo de navegación por teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detectar si se está navegando con teclado
      if (event.key === 'Tab' || event.key === 'Shift' || event.key === 'Enter' || event.key === ' ') {
        setSettings(prev => ({ ...prev, keyboardNavigation: true }));
      }

      // Atajos de accesibilidad
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        // Saltar al contenido principal
        const mainContent = document.getElementById('main-content');
        mainContent?.focus();
      }

      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        // Saltar al menú de navegación
        const navigation = document.getElementById('main-navigation');
        navigation?.focus();
      }

      if (event.altKey && event.key === 's') {
        event.preventDefault();
        // Saltar al buscador
        const search = document.getElementById('search-input');
        search?.focus();
      }
    };

    const handleMouseDown = () => {
      // Si se usa el ratón, desactivar indicador de navegación por teclado
      setSettings(prev => ({ ...prev, keyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Aplicar clases CSS según la configuración
  useEffect(() => {
    const root = document.documentElement;

    // Aplicar clases CSS
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('large-text', settings.largeText);
    root.classList.toggle('keyboard-nav', settings.keyboardNavigation);
    root.classList.toggle('screen-reader', settings.screenReader);

    // Aplicar estilos dinámicos
    if (settings.highContrast) {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f0f0f0');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#333333');
      root.style.setProperty('--border-color', '#000000');
      root.style.setProperty('--focus-ring', '#0000ff');
    }

    if (settings.largeText) {
      root.style.setProperty('--font-size-base', '18px');
      root.style.setProperty('--font-size-lg', '20px');
      root.style.setProperty('--font-size-xl', '24px');
    }

    return () => {
      // Limpiar estilos al desmontar
      root.classList.remove(
        'reduced-motion',
        'high-contrast',
        'large-text',
        'keyboard-nav',
        'screen-reader'
      );
      
      // Restaurar estilos por defecto
      root.style.removeProperty('--bg-primary');
      root.style.removeProperty('--bg-secondary');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--text-secondary');
      root.style.removeProperty('--border-color');
      root.style.removeProperty('--focus-ring');
      root.style.removeProperty('--font-size-base');
      root.style.removeProperty('--font-size-lg');
      root.style.removeProperty('--font-size-xl');
    };
  }, [settings]);

  // Función para anunciar cambios a lectores de pantalla
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Eliminar después de anunciar
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Función para verificar contraste de colores
  const checkContrast = useCallback((foreground: string, background: string) => {
    // Convertir hex a RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);

    if (!fg || !bg) return false;

    // Calcular luminancia relativa
    const getLuminance = (color: { r: number; g: number; b: number }) => {
      const [r, g, b] = [color.r, color.g, color.b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(fg);
    const l2 = getLuminance(bg);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    // WCAG AA requiere contraste >= 4.5 para texto normal
    return contrast >= 4.5;
  }, []);

  // Función para manejar foco
  const manageFocus = useCallback((element: HTMLElement) => {
    // Asegurar que el elemento sea focusable
    if (!element) return;

    element.setAttribute('tabindex', element.tabIndex >= 0 ? element.tabIndex.toString() : '0');
    element.focus();

    // Anunciar a lectores de pantalla
    const label = element.getAttribute('aria-label') || element.textContent || '';
    if (label) {
      announceToScreenReader(`Enfocado en: ${label}`);
    }
  }, [announceToScreenReader]);

  // Función para crear skip links
  const createSkipLinks = useCallback(() => {
    const skipLinks = [
      { href: '#main-content', text: 'Saltar al contenido principal' },
      { href: '#main-navigation', text: 'Saltar a la navegación' },
      { href: '#search-input', text: 'Saltar al buscador' }
    ];

    const container = document.createElement('div');
    container.className = 'skip-links';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', 'Enlaces de salto rápido');

    skipLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.className = 'skip-link';
      container.appendChild(a);
    });

    // Insertar al principio del body
    document.body.insertBefore(container, document.body.firstChild);
  }, []);

  // Función para validar accesibilidad
  const validateAccessibility = useCallback(() => {
    const issues: string[] = [];

    // Verificar imágenes con alt
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} imágenes sin atributo alt`);
    }

    // Verificar botones sin aria-label
    const buttonsWithoutLabel = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    if (buttonsWithoutLabel.length > 0) {
      issues.push(`${buttonsWithoutLabel.length} botones sin etiqueta accesible`);
    }

    // Verificar enlaces sin texto descriptivo
    const linksWithoutText = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby]):empty');
    if (linksWithoutText.length > 0) {
      issues.push(`${linksWithoutText.length} enlaces sin texto descriptivo`);
    }

    // Verificar headings correctos
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.substring(1)));
    const sortedLevels = [...headingLevels].sort((a, b) => a - b);
    
    for (let i = 1; i < sortedLevels.length; i++) {
      if (sortedLevels[i] - sortedLevels[i - 1] > 1) {
        issues.push('Niveles de encabezado no secuenciales');
        break;
      }
    }

    // Verificar contraste de colores (simplificado)
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    let contrastIssues = 0;
    
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      
      if (color && bgColor && color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
        // Simplificado: solo verificar que no sean iguales
        if (color === bgColor) {
          contrastIssues++;
        }
      }
    });

    if (contrastIssues > 0) {
      issues.push(`${contrastIssues} elementos con posible problema de contraste`);
    }

    return {
      issues,
      score: Math.max(0, 100 - issues.length * 10),
      passed: issues.length === 0
    };
  }, []);

  return {
    settings,
    announceToScreenReader,
    checkContrast,
    manageFocus,
    createSkipLinks,
    validateAccessibility
  };
};
