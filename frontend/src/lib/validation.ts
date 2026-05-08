import { z } from 'zod';

// Enhanced validation schemas with comprehensive error messages
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .max(254, 'El email no puede exceder 254 caracteres')
  .email('Formato de email inválido')
  .regex(/^[^\s@]+[^\s@]+\.[^\s@]+$/, 'Email inválido');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede exceder 128 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial',
  });

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
  .optional();

export const nameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(50, 'El nombre no puede exceder 50 caracteres')
  .regex(/^[a-zA-Z\s]+$/, 'El nombre solo puede contener letras y espacios');

export const addressSchema = z
  .string()
  .min(10, 'La dirección debe tener al menos 10 caracteres')
  .max(200, 'La dirección no puede exceder 200 caracteres');

export const quantitySchema = z
  .number()
  .min(1, 'La cantidad debe ser al menos 1')
  .max(99, 'La cantidad no puede exceder 99')
  .int('La cantidad debe ser un número entero');

export const productIdSchema = z
  .string()
  .min(1, 'El ID del producto es requerido')
  .uuid('ID de producto inválido');

// Enhanced login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Enhanced register schema
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Cart item validation
export const cartItemSchema = z.object({
  productId: productIdSchema,
  quantity: quantitySchema,
  customizations: z.string().optional(),
});

// Checkout validation
export const checkoutSchema = z.object({
  deliveryAddress: addressSchema.optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

// Order status validation
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']);

// Product validation
export const productSchema = z.object({
  name: nameSchema,
  description: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres'),
  price: z.number().min(0, 'El precio debe ser positivo').max(99999, 'El precio no puede exceder 99999'),
  category: z.string().min(1, 'La categoría es requerida').max(50, 'La categoría no puede exceder 50 caracteres'),
  active: z.boolean().default(true),
  stock: z.number().min(0, 'El stock debe ser positivo').max(9999, 'El stock no puede exceder 9999'),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'El término de búsqueda debe tener al menos 1 carácter').max(100, 'El término de búsqueda no puede exceder 100 caracteres'),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
});

// Validation helper functions
export const validateEmail = (email: string) => {
  try {
    emailSchema.parse(email);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

export const validatePassword = (password: string) => {
  try {
    passwordSchema.parse(password);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

export const validatePhone = (phone: string) => {
  try {
    phoneSchema.parse(phone);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};
