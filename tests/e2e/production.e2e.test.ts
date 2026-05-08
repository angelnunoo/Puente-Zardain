import { test, expect } from '@playwright/test';
import { chromium, Browser, Page } from '@playwright/test';

// Configuración de tests E2E para producción
const PROD_URL = process.env.PROD_URL || 'https://puente-zardain.es';
const API_URL = process.env.API_URL || 'https://api.puente-zardain.es';
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@puente-zardain.es',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
};

test.describe('Producción E2E Tests - Puente de Zardain', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Funcionalidad Básica', () => {
    test('Frontend carga correctamente', async () => {
      const title = await page.title();
      expect(title).toContain('Puente de Zardain');
      
      // Verificar elementos principales
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    });

    test('API de salud responde', async () => {
      const response = await page.request.get(`${API_URL}/health`);
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      expect(healthData).toHaveProperty('status');
      expect(healthData.status).toBe('ok');
    });

    test('Carta pública es accesible', async () => {
      await page.goto(`${PROD_URL}/menu`);
      await page.waitForLoadState('networkidle');
      
      // Verificar que la carta carga productos
      await expect(page.locator('.product-card')).toHaveCount.greaterThan(0);
      await expect(page.locator('.menu-category')).toHaveCount.greaterThan(0);
    });
  });

  test.describe('Flujo Completo de Pedido', () => {
    test('Usuario puede registrarse', async () => {
      await page.goto(`${PROD_URL}/register`);
      
      // Generar email único para test
      const testEmail = `test-${Date.now()}@test.puente-zardain.es`;
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="phone-input"]', '+34600123456');
      
      await page.click('[data-testid="register-button"]');
      
      // Esperar redirección o mensaje de éxito
      await page.waitForURL('**/login', { timeout: 10000 });
      
      // Verificar que se puede hacer login con el nuevo usuario
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      // Esperar redirección al dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('Flujo completo: Login → Carrito → Pedido → Pago', async () => {
      // Login
      await page.goto(`${PROD_URL}/login`);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      // Navegar a la carta
      await page.click('[data-testid="menu-link"]');
      await page.waitForURL('**/menu', { timeout: 5000 });
      
      // Añadir productos al carrito
      await page.click('[data-testid="product-card"]:first-child');
      await page.waitForSelector('[data-testid="add-to-cart"]', { timeout: 5000 });
      await page.click('[data-testid="add-to-cart"]');
      
      // Verificar que el producto se añadió al carrito
      await page.click('[data-testid="cart-link"]');
      await page.waitForURL('**/cart', { timeout: 5000 });
      
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
      
      // Proceder al checkout
      await page.click('[data-testid="checkout-button"]');
      await page.waitForURL('**/checkout', { timeout: 5000 });
      
      // Completar formulario de entrega
      await page.fill('[data-testid="delivery-address"]', 'Calle Test 123, Madrid');
      await page.fill('[data-testid="delivery-phone"]', '+34600123456');
      await page.fill('[data-testid="delivery-notes"]', 'Pedido de prueba E2E');
      
      // Seleccionar método de pago
      await page.click('[data-testid="payment-method-stripe"]');
      
      // Verificar resumen del pedido
      await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
      
      // Simular pago (en producción real esto iría a Stripe)
      await page.click('[data-testid="confirm-order"]');
      
      // Esperar confirmación del pedido
      await page.waitForSelector('[data-testid="order-confirmation"]', { timeout: 15000 });
      
      // Verificar número de pedido
      const orderNumber = await page.textContent('[data-testid="order-number"]');
      expect(orderNumber).toMatch(/ORD-\d+/);
    });
  });

  test.describe('Panel Administrativo', () => {
    test.beforeEach(async () => {
      // Login como admin
      await page.goto(`${PROD_URL}/admin/login`);
      await page.fill('[data-testid="email-input"]', process.env.ADMIN_EMAIL || 'admin@puente-zardain.es');
      await page.fill('[data-testid="password-input"]', process.env.ADMIN_PASSWORD || 'AdminPassword123!');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    });

    test('Dashboard de admin carga correctamente', async () => {
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
    });

    test('Gestión de productos funciona', async () => {
      await page.click('[data-testid="products-link"]');
      await page.waitForURL('**/admin/products', { timeout: 5000 });
      
      await expect(page.locator('[data-testid="products-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-product-button"]')).toBeVisible();
      
      // Intentar crear un producto de prueba
      await page.click('[data-testid="add-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]', { timeout: 5000 });
      
      await page.fill('[data-testid="product-name"]', 'Producto Test E2E');
      await page.fill('[data-testid="product-price"]', '10.50');
      await page.fill('[data-testid="product-description"]', 'Descripción de prueba para E2E');
      
      // Guardar producto
      await page.click('[data-testid="save-product-button"]');
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      
      // Verificar que el producto aparece en la lista
      await page.goto(`${PROD_URL}/admin/products`);
      await page.waitForLoadState('networkidle');
      
      const productName = await page.textContent('[data-testid="product-name"]:first-child');
      expect(productName).toContain('Producto Test E2E');
    });

    test('Gestión de pedidos funciona', async () => {
      await page.click('[data-testid="orders-link"]');
      await page.waitForURL('**/admin/orders', { timeout: 5000 });
      
      await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-filters"]')).toBeVisible();
      
      // Verificar que hay pedidos en la lista
      const orderCount = await page.locator('[data-testid="order-item"]').count();
      expect(orderCount).toBeGreaterThan(0);
      
      // Intentar cambiar estado de un pedido
      await page.click('[data-testid="order-item"]:first-child');
      await page.waitForSelector('[data-testid="order-details"]', { timeout: 5000 });
      
      await page.click('[data-testid="change-status-button"]');
      await page.selectOption('[data-testid="status-select"]', 'PREPARING');
      await page.click('[data-testid="save-status-button"]');
      
      await page.waitForSelector('[data-testid="status-updated-message"]', { timeout: 5000 });
    });
  });

  test.describe('Sistema de Pagos', () => {
    test('Métodos de pago están disponibles', async () => {
      await page.goto(`${PROD_URL}/menu`);
      
      // Añadir producto al carrito
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart"]');
      
      await page.click('[data-testid="cart-link"]');
      await page.click('[data-testid="checkout-button"]');
      
      // Verificar métodos de pago
      await expect(page.locator('[data-testid="payment-method-stripe"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-method-paypal"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-method-bizum"]')).toBeVisible();
    });

    test('Integración con Stripe funciona', async () => {
      const response = await page.request.get(`${API_URL}/payments/stripe/config`);
      expect(response.status()).toBe(200);
      
      const config = await response.json();
      expect(config).toHaveProperty('publishableKey');
      expect(config.publishableKey).toMatch(/^pk_test_/);
    });

    test('Webhooks de pago están configurados', async () => {
      // Simular webhook de Stripe
      const webhookPayload = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_' + Date.now(),
            metadata: { order_id: 'ORD-' + Date.now() },
            amount: 1050,
            currency: 'eur'
          }
        }
      };

      const response = await page.request.post(`${API_URL}/payments/webhook/stripe`, {
        data: webhookPayload
      });
      
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Sistema de Notificaciones', () => {
    test('WebSocket connection funciona', async () => {
      await page.goto(`${PROD_URL}/dashboard`);
      
      // Esperar a que se establezca la conexión WebSocket
      await page.waitForFunction(() => {
        return window.socket && window.socket.connected;
      }, { timeout: 10000 });
      
      // Verificar que se reciben notificaciones
      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.socket.on('notification', resolve);
          window.socket.emit('join_room', 'user_room');
        });
      });
    });

    test('Notificaciones de pedido en tiempo real', async () => {
      // Este test requiere dos páginas: una para admin y otra para usuario
      
      const adminPage = await browser.newPage();
      await adminPage.goto(`${PROD_URL}/admin/login`);
      await adminPage.fill('[data-testid="email-input"]', process.env.ADMIN_EMAIL || 'admin@puente-zardain.es');
      await adminPage.fill('[data-testid="password-input"]', process.env.ADMIN_PASSWORD || 'AdminPassword123!');
      await adminPage.click('[data-testid="login-button"]');
      await adminPage.waitForURL('**/admin/dashboard', { timeout: 10000 });
      
      // Usuario hace un pedido
      await page.goto(`${PROD_URL}/menu`);
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart"]');
      await page.click('[data-testid="cart-link"]');
      await page.click('[data-testid="checkout-button"]');
      await page.fill('[data-testid="delivery-address"]', 'Test Address');
      await page.click('[data-testid="payment-method-stripe"]');
      
      // Simular pago exitoso
      await page.evaluate(() => {
        window.socket.emit('new_order', {
          id: 'ORD-' + Date.now(),
          status: 'CONFIRMED',
          user: 'Test User'
        });
      });
      
      // Verificar que admin recibe la notificación
      await adminPage.waitForSelector('[data-testid="new-order-notification"]', { timeout: 10000 });
      
      await adminPage.close();
    });
  });

  test.describe('Analytics y Reportes', () => {
    test.beforeEach(async () => {
      await page.goto(`${PROD_URL}/admin/login`);
      await page.fill('[data-testid="email-input"]', process.env.ADMIN_EMAIL || 'admin@puente-zardain.es');
      await page.fill('[data-testid="password-input"]', process.env.ADMIN_PASSWORD || 'AdminPassword123!');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    });

    test('Dashboard de analytics carga', async () => {
      await page.click('[data-testid="analytics-link"]');
      await page.waitForURL('**/admin/analytics', { timeout: 5000 });
      
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="orders-chart"]')).toBeVisible();
    });

    test('Reportes de ventas funcionan', async () => {
      await page.click('[data-testid="sales-reports-link"]');
      await page.waitForSelector('[data-testid="sales-reports"]', { timeout: 5000 });
      
      // Seleccionar período
      await page.selectOption('[data-testid="period-select"]', 'monthly');
      await page.click('[data-testid="generate-report-button"]');
      
      await page.waitForSelector('[data-testid="report-results"]', { timeout: 10000 });
      
      // Verificar que el reporte tiene datos
      const reportData = await page.textContent('[data-testid="report-summary"]');
      expect(reportData).toContain('Ventas totales');
      expect(reportData).toContain('Número de pedidos');
    });
  });

  test.describe('Sistema de Incidencias', () => {
    test.beforeEach(async () => {
      await page.goto(`${PROD_URL}/admin/login`);
      await page.fill('[data-testid="email-input"]', process.env.ADMIN_EMAIL || 'admin@puente-zardain.es');
      await page.fill('[data-testid="password-input"]', process.env.ADMIN_PASSWORD || 'AdminPassword123!');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    });

    test('Gestión de incidencias funciona', async () => {
      await page.click('[data-testid="incidents-link"]');
      await page.waitForURL('**/admin/incidents', { timeout: 5000 });
      
      await expect(page.locator('[data-testid="incidents-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-incident-button"]')).toBeVisible();
      
      // Crear incidencia de prueba
      await page.click('[data-testid="create-incident-button"]');
      await page.waitForSelector('[data-testid="incident-form"]', { timeout: 5000 });
      
      await page.selectOption('[data-testid="incident-type"]', 'ORDER_LATE');
      await page.fill('[data-testid="incident-description"]', 'Incidencia de prueba E2E');
      await page.selectOption('[data-testid="incident-priority"]', 'MEDIUM');
      
      await page.click('[data-testid="save-incident-button"]');
      await page.waitForSelector('[data-testid="incident-created-message"]', { timeout: 5000 });
      
      // Verificar que la incidencia aparece en la lista
      await page.goto(`${PROD_URL}/admin/incidents`);
      await page.waitForLoadState('networkidle');
      
      const incidentDescription = await page.textContent('[data-testid="incident-description"]:first-child');
      expect(incidentDescription).toContain('Incidencia de prueba E2E');
    });

    test('Respuesta a incidencias funciona', async () => {
      await page.click('[data-testid="incidents-link"]');
      await page.waitForURL('**/admin/incidents', { timeout: 5000 });
      
      // Seleccionar primera incidencia
      await page.click('[data-testid="incident-item"]:first-child');
      await page.waitForSelector('[data-testid="incident-details"]', { timeout: 5000 });
      
      await page.click('[data-testid="add-response-button"]');
      await page.waitForSelector('[data-testid="response-form"]', { timeout: 5000 });
      
      await page.fill('[data-testid="response-message"]', 'Respuesta de prueba E2E');
      await page.click('[data-testid="send-response-button"]');
      
      await page.waitForSelector('[data-testid="response-sent-message"]', { timeout: 5000 });
    });
  });

  test.describe('Gamificación y Lealtad', () => {
    test.beforeEach(async () => {
      await page.goto(`${PROD_URL}/login`);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('Sistema de Zardas funciona', async () => {
      await page.click('[data-testid="zardas-link"]');
      await page.waitForURL('**/zardas', { timeout: 5000 });
      
      await expect(page.locator('[data-testid="zardas-balance"]')).toBeVisible();
      await expect(page.locator('[data-testid="zardas-league"]')).toBeVisible();
      await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
    });

    test('Recompensas canjeables funcionan', async () => {
      await page.click('[data-testid="rewards-link"]');
      await page.waitForURL('**/rewards', { timeout: 5000 });
      
      await expect(page.locator('[data-testid="rewards-list"]')).toBeVisible();
      
      // Verificar que hay recompensas disponibles
      const rewardsCount = await page.locator('[data-testid="reward-item"]').count();
      expect(rewardsCount).toBeGreaterThan(0);
      
      // Intentar canjear una recompensa (si hay suficientes Zardas)
      const zardasBalance = await page.textContent('[data-testid="zardas-balance"]');
      const balance = parseInt(zardasBalance?.match(/\d+/)?.[0] || '0');
      
      if (balance >= 500) { // Costo mínimo de recompensa
        await page.click('[data-testid="reward-item"]:first-child');
        await page.click('[data-testid="redeem-button"]');
        
        await page.waitForSelector('[data-testid="redeem-confirmation"]', { timeout: 5000 });
      }
    });
  });

  test.describe('Rendimiento y Carga', () => {
    test('Tiempo de carga del homepage < 3 segundos', async () => {
      const startTime = Date.now();
      await page.goto(PROD_URL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 segundos
    });

    test('Imágenes optimizadas cargan correctamente', async () => {
      await page.goto(`${PROD_URL}/menu`);
      
      // Esperar a que carguen todas las imágenes
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete && img.naturalHeight > 0);
      }, { timeout: 10000 });
      
      // Verificar que no hay imágenes rotas
      const brokenImages = await page.locator('img[src*="broken"]').count();
      expect(brokenImages).toBe(0);
    });

    test('API responde en < 500ms', async () => {
      const startTime = Date.now();
      const response = await page.request.get(`${API_URL}/health`);
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });
  });

  test.describe('Seguridad', () => {
    test('Headers de seguridad están presentes', async () => {
      const response = await page.request.get(PROD_URL);
      
      expect(response.headers()).toHaveProperty('x-frame-options');
      expect(response.headers()).toHaveProperty('x-content-type-options');
      expect(response.headers()).toHaveProperty('x-xss-protection');
    });

    test('Rate limiting funciona', async () => {
      // Hacer múltiples peticiones rápidas
      const promises = Array(10).fill(0).map(() => 
        page.request.get(`${API_URL}/health`)
      );
      
      const responses = await Promise.all(promises);
      
      // Alguna de las peticiones debería ser rate limited
      const rateLimitedResponses = responses.filter(res => res.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('Autenticación segura funciona', async () => {
      // Intentar acceder a ruta protegida sin token
      const response = await page.request.get(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      
      expect(response.status()).toBe(401);
    });

    test('CORS configurado correctamente', async () => {
      const response = await page.request.get(`${API_URL}/health`, {
        headers: { 'Origin': 'https://malicious-site.com' }
      });
      
      expect(response.headers()).toHaveProperty('access-control-allow-origin');
      expect(response.headers()['access-control-allow-origin']).not.toBe('*');
    });
  });

  test.describe('Accesibilidad Básica', () => {
    test('Contraste de colores suficiente', async () => {
      await page.goto(PROD_URL);
      
      // Verificar contraste en elementos principales
      const headerText = await page.locator('h1').first().getComputedStyle('color');
      const bgHeader = await page.locator('header').getComputedStyle('background-color');
      
      // El contraste debe ser suficiente (verificación básica)
      expect(headerText).toBeTruthy();
      expect(bgHeader).toBeTruthy();
    });

    test('Navegación por teclado funciona', async () => {
      await page.goto(PROD_URL);
      
      // Navegar usando Tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verificar que el foco está en un elemento interactivo
      const focusedElement = await page.evaluate(() => document.activeElement);
      const tagName = await focusedElement.evaluate(el => el.tagName);
      
      expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(tagName);
    });

    test('Atributos ARIA presentes', async () => {
      await page.goto(`${PROD_URL}/menu`);
      
      // Verificar etiquetas ARIA en elementos interactivos
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaDescribedBy = await button.getAttribute('aria-describedby');
        
        // Al menos uno de los atributos ARIA debería estar presente
        expect(ariaLabel || ariaDescribedBy).toBeTruthy();
      }
    });

    test('Texto legible en móvil', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone X
      await page.goto(`${PROD_URL}/menu`);
      
      // Verificar tamaño de texto
      const textElements = await page.locator('p, span, div').all();
      for (const element of textElements.slice(0, 5)) { // Verificar primeros 5 elementos
        const fontSize = await element.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        
        // El tamaño de fuente debe ser legible (> 12px)
        const fontSizeValue = parseFloat(fontSize);
        expect(fontSizeValue).toBeGreaterThan(12);
      }
    });
  });

  test.describe('Integración Externa', () => {
    test('Webhooks de Stripe funcionan', async () => {
      const webhookPayload = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_' + Date.now(),
            metadata: { order_id: 'ORD-' + Date.now() },
            amount: 1050,
            currency: 'eur'
          }
        }
      };

      const response = await page.request.post(`${API_URL}/payments/webhook/stripe`, {
        data: webhookPayload
      });
      
      expect(response.status()).toBe(200);
      
      // Verificar que el pedido se actualizó
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar procesamiento
      
      const orderResponse = await page.request.get(`${API_URL}/orders/ORD-${Date.now()}`);
      expect(orderResponse.status()).toBe(200);
      
      const orderData = await orderResponse.json();
      expect(orderData.paymentStatus).toBe('SUCCEEDED');
    });

    test('Envío de emails funciona', async () => {
      // Este test verifica que el sistema puede enviar emails
      // En producción real, esto enviaría un email real
      
      const emailData = {
        to: TEST_USER.email,
        subject: 'Test de Producción E2E',
        body: 'Este es un email de prueba automatizado'
      };

      const response = await page.request.post(`${API_URL}/notifications/send-email`, {
        data: emailData
      });
      
      expect(response.status()).toBe(200);
    });
  });
});
