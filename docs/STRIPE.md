# Integración Stripe

## Setup

### 1. Crear cuenta en Stripe
- Ir a https://stripe.com
- Registrarse
- Obtener API keys (test y prod)

### 2. Guardar en .env

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Instalar SDK

```bash
npm install stripe
npm install @stripe/stripe-js  # Frontend
```

## Backend - Crear Servicio de Pagos

```typescript
// src/payments/payments.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  async createPaymentIntent(amount: number) {
    return this.stripe.paymentIntents.create({
      amount: amount * 100, // cents
      currency: 'eur',
    });
  }

  async confirmPayment(paymentIntentId: string) {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return intent.status === 'succeeded';
  }
}
```

## Frontend - Integración

```typescript
// Frontend component
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

const { clientSecret } = await fetch('/api/payment', {
  method: 'POST',
  body: JSON.stringify({ amount: 50 }),
}).then(r => r.json());

const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
  },
});
```

## Webhook para Confirmar Pago

```typescript
@Post('webhook')
async handleWebhook(@Req() request) {
  const sig = request.headers['stripe-signature'];
  
  let event;
  try {
    event = this.stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { received: false };
  }

  if (event.type === 'payment_intent.succeeded') {
    // Marcar orden como pagada
    const paymentIntentId = event.data.object.id;
    await this.ordersService.markAsPaid(paymentIntentId);
  }

  return { received: true };
}
```

## Testing en Desarrollo

Usar tarjetas de prueba:
- Exitosa: `4242 4242 4242 4242`
- Rechazada: `4000 0000 0000 0002`
- Expirada: `4000 0000 0000 0069`

Mes/Año: cualquiera en futuro
CVC: 123