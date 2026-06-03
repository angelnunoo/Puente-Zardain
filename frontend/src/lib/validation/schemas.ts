import { z } from 'zod';

// Esquema de validación para login
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(50, 'La contraseña no puede exceder 50 caracteres'),
});

// Esquema de validación para registro
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),
  phone: z.string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, 'Teléfono inválido')
    .min(9, 'El teléfono debe tener al menos 9 dígitos')
    .max(15, 'El teléfono no puede exceder 15 caracteres'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(50, 'La contraseña no puede exceder 50 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'),
  confirmPassword: z.string()
    .min(1, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Esquema de validación para checkout
export const checkoutSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(9, 'El teléfono es requerido'),
  email: z.string().email('Email inválido'),
  deliveryType: z.enum(['pickup', 'delivery'], {
    errorMap: (issue, ctx) => ({ message: 'Tipo de entrega inválido' }),
  }),
  address: z.object({
    street: z.string().min(1, 'La calle es requerida'),
    city: z.string().min(1, 'La ciudad es requerida'),
    postalCode: z.string().min(5, 'El código postal es requerido'),
  }).optional(),
  paymentMethod: z.enum(['cash', 'card'], {
    errorMap: (issue, ctx) => ({ message: 'Método de pago inválido' }),
  }),
});

// Esquema de validación para contacto
export const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

// Tipos inferidos para TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
