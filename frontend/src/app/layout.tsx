import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import FloatingCartFixed from '../components/home/floating-cart-fixed';

export const metadata: Metadata = {
  title: 'Puente de Zardain',
  description: 'Plataforma de pedidos online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <FloatingCartFixed />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
