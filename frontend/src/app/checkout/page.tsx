'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { ordersApi, paymentsApi } from '../../lib/api'
import { PaymentMethod } from '../../../../../shared/enums'

export default function CheckoutPage() {
  const { token, user } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CARD)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    // Obtener el último pedido del carrito
    const loadOrderAndPaymentMethods = async () => {
      try {
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]')
        if (cartItems.length === 0) {
          router.push('/cart')
          return
        }

        // Crear pedido temporal para checkout
        const orderResponse = await ordersApi.createOrder(token, {
          items: cartItems,
          delivery: true,
        })

        setOrder(orderResponse)

        // Obtener métodos de pago disponibles
        const methods = await paymentsApi.getAvailablePaymentMethods(token, orderResponse.total)
        setPaymentMethods(methods)

        // Si el método seleccionado no está disponible, cambiar al primero disponible
        const availableMethod = methods.find(m => m.type === selectedMethod)
        if (!availableMethod && methods.length > 0) {
          setSelectedMethod(methods[0].type)
        }
      } catch (err: any) {
        addNotification({
          id: `checkout_error_${Date.now()}`,
          type: 'error',
          title: 'Error al cargar checkout',
          message: err.message || 'No se pudo cargar la información del pedido',
          timestamp: new Date(),
        })
      }
    }

    loadOrderAndPaymentMethods()
  }, [token, router, selectedMethod, addNotification])

  const handlePaymentMethodChange = async (method: PaymentMethod) => {
    setSelectedMethod(method)
    setErrors([])

    if (method === PaymentMethod.CARD && order) {
      try {
        setLoading(true)
        const intent = await paymentsApi.createStripeIntent(token, { orderId: order.id })
        setClientSecret(intent.clientSecret)
      } catch (err: any) {
        setErrors([err.message || 'Error al configurar pago con tarjeta'])
      } finally {
        setLoading(false)
      }
    } else {
      setClientSecret(null)
    }
  }

  const handlePayPalPayment = async () => {
    if (!order) return

    try {
      setLoading(true)
      const paypalResponse = await paymentsApi.createPayPalPayment(token, { orderId: order.id })
      
      // Redirigir a PayPal
      window.location.href = paypalResponse.paymentUrl
    } catch (err: any) {
      setErrors([err.message || 'Error al iniciar pago con PayPal'])
    } finally {
      setLoading(false)
    }
  }

  const handleBizumPayment = async () => {
    if (!order) return

    try {
      setLoading(true)
      const bizumResponse = await paymentsApi.createBizumPayment(token, { orderId: order.id })
      
      addNotification({
        id: `bizum_${Date.now()}`,
        type: 'info',
        title: 'Pago con Bizum',
        message: bizumResponse.message,
        timestamp: new Date(),
        data: bizumResponse,
      })

      // Mostrar instrucciones de Bizum
      alert(bizumResponse.message)
    } catch (err: any) {
      setErrors([err.message || 'Error al iniciar pago con Bizum'])
    } finally {
      setLoading(false)
    }
  }

  const handleCashPayment = async () => {
    if (!order) return

    try {
      setLoading(true)
      await paymentsApi.processCashPayment(token, { orderId: order.id })
      
      addNotification({
        id: `cash_${Date.now()}`,
        type: 'success',
        title: 'Pedido Confirmado',
        message: 'Tu pedido ha sido confirmado. Pagarás en efectivo al recibirlo.',
        timestamp: new Date(),
      })

      // Limpiar carrito y redirigir
      localStorage.removeItem('cart')
      router.push('/orders')
    } catch (err: any) {
      setErrors([err.message || 'Error al procesar pago en efectivo'])
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaymentProcessing(true)
    setErrors([])

    try {
      switch (selectedMethod) {
        case PaymentMethod.CARD:
          // El pago con tarjeta se maneja con Stripe Elements
          break
        case PaymentMethod.PAYPAL:
          await handlePayPalPayment()
          break
        case PaymentMethod.BIZUM:
          await handleBizumPayment()
          break
        case PaymentMethod.CASH:
          await handleCashPayment()
          break
      }
    } catch (err: any) {
      setErrors([err.message || 'Error al procesar el pago'])
    } finally {
      setPaymentProcessing(false)
    }
  }

  const getMethodInfo = (method: PaymentMethod) => {
    return paymentMethods.find(m => m.type === method)
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando información del pedido...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Completa tu pedido de Puente de Zardain</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Resumen del Pedido */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h2>
              
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="font-medium">{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium">{formatPrice(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h2>
              
              {/* Lista de métodos de pago */}
              <div className="space-y-3">
                {paymentMethods.map((method: any) => (
                  <div key={method.type} className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.type}
                        checked={selectedMethod === method.type}
                        onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">
                              {method.type === PaymentMethod.CARD && '💳 Tarjeta'}
                              {method.type === PaymentMethod.PAYPAL && '🅿️ PayPal'}
                              {method.type === PaymentMethod.BIZUM && '📱 Bizum'}
                              {method.type === PaymentMethod.CASH && '💵 Efectivo'}
                            </span>
                            <div className="text-sm text-gray-600">
                              Comisión: {method.fee * 100}%
                              {method.fixed > 0 && ` + €${method.fixed}`}
                            </div>
                          </div>
                          {method.fee > 0 && (
                            <div className="text-sm text-gray-500">
                              +{formatPrice(order.total * method.fee + method.fixed)}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                ))}
              </div>

              {/* Errores */}
              {errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">
                    {errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de Pago */}
              <button
                onClick={handlePayment}
                disabled={loading || paymentProcessing}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {paymentProcessing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </span>
                ) : (
                  <span>
                    {selectedMethod === PaymentMethod.CARD && 'Pagar con Tarjeta'}
                    {selectedMethod === PaymentMethod.PAYPAL && 'Pagar con PayPal'}
                    {selectedMethod === PaymentMethod.BIZUM && 'Pagar con Bizum'}
                    {selectedMethod === PaymentMethod.CASH && 'Confirmar Pedido'}
                  </span>
                )}
              </button>

              {/* Información de seguridad */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">🔒 Pago Seguro</div>
                  <div>Tu información de pago está protegida con encriptación SSL.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Elements para pago con tarjeta */}
        {selectedMethod === PaymentMethod.CARD && clientSecret && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Tarjeta</h3>
              {/* Aquí iría el componente de Stripe Elements */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 text-center">
                  Stripe Elements se integrará aquí para procesar pagos con tarjeta de forma segura.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
