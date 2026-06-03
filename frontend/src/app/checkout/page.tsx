'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { ordersApi, paymentsApi, zardasApi } from '../../lib/api'

const PaymentMethod = {
  CARD: 'CARD',
  CASH: 'CASH',
} as const

type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export default function CheckoutPage() {
  const { token, user } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CARD)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [delivery, setDelivery] = useState(false)
  const [address, setAddress] = useState('')
  const [zardasBalance, setZardasBalance] = useState<any>(null)
  const [zardasHistory, setZardasHistory] = useState<any[]>([])
  const [selectedRedemption, setSelectedRedemption] = useState<number | null>(null)

  useEffect(() => {
    if (!token || !user?.id) {
      router.push('/login')
      return
    }

    const loadPreview = async () => {
      try {
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]')
        if (cartItems.length === 0) {
          router.push('/cart')
          return
        }

        const previewPayload = {
          items: cartItems,
          delivery,
          address: delivery ? address : undefined,
          redemption: selectedRedemption ? { discountAmount: selectedRedemption } : undefined,
        }

        const previewOrder = await ordersApi.previewOrder(token, previewPayload)
        setOrder(previewOrder)

        const methods = await paymentsApi.getAvailablePaymentMethods(token, previewOrder.total)
        setPaymentMethods(methods)

        const availableMethod = methods.find((m) => m.type === selectedMethod)
        if (!availableMethod && methods.length > 0) {
          setSelectedMethod(methods[0].type)
        }

        const balance = await zardasApi.getBalance(token, user.id)
        const history = await zardasApi.getHistory(token, user.id)
        setZardasBalance(balance)
        setZardasHistory(history)
      } catch (err: any) {
        const message = err.message || 'No se pudo cargar la información del pedido'
        addNotification({
          id: `checkout_error_${Date.now()}`,
          type: 'error',
          title: 'Error al cargar checkout',
          message,
          timestamp: new Date(),
        })
        setFetchError(message)
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [token, router, delivery, address, selectedRedemption, selectedMethod, addNotification, user?.id])

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setErrors([])
  }

  const handlePayment = async () => {
    if (!order) {
      setErrors(['No se pudo procesar el pedido. Intenta de nuevo.'])
      return
    }

    if (order.total < 15) {
      setErrors(['El pedido mínimo es de 15 €.'])
      return
    }

    setPaymentProcessing(true)
    setErrors([])

    try {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]')
      await ordersApi.createOrder(token, {
        items: cartItems,
        delivery,
        address: delivery ? address : undefined,
        paymentMethod: selectedMethod,
        redemption: selectedRedemption ? { discountAmount: selectedRedemption } : undefined,
      })

      localStorage.removeItem('cart')
      router.push('/orders')
    } catch (err: any) {
      setErrors([err.message || 'Error al confirmar el pedido'])
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
    if (loading) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">No se pudo cargar el pedido</h2>
          <p className="mt-2 text-gray-600">{fetchError || 'Comprueba tu carrito o intenta recargar la página.'}</p>
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

        {/* Opción de Entrega */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Servicio</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="radio" name="service" checked={!delivery} onChange={() => setDelivery(false)} className="mr-3" />
              <span>Recogida en local</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="service" checked={delivery} onChange={() => setDelivery(true)} className="mr-3" />
              <span>Domicilio (solo Arroyomolinos)</span>
            </label>
          </div>
          {delivery && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de entrega</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="Calle, número, piso..." />
            </div>
          )}
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
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento Zardas</span>
                    <span className="font-medium">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Zardas Loyalty */ }
            {zardasBalance && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sistema de Zardas</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Saldo disponible:</span>
                    <span className="font-bold text-green-600">{zardasBalance.available} Zardas</span>
                  </div>
                  {zardasBalance.available > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Canjear Zardas por descuento</label>
                      <select
                        value={selectedRedemption || ''}
                        onChange={(e) => setSelectedRedemption(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="">No canjear</option>
                        {zardasBalance.available >= 5 && <option value="5">5 Zardas = 5€ descuento</option>}
                        {zardasBalance.available >= 10 && <option value="10">10 Zardas = 10€ descuento</option>}
                        {zardasBalance.available >= 15 && <option value="15">15 Zardas = 15€ descuento</option>}
                      </select>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Ganas 10% del total del pedido en Zardas al completar el pedido.</p>
                  {zardasHistory.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-gray-700">
                      <h3 className="font-semibold text-gray-900 mb-2">Historial reciente</h3>
                      <ul className="space-y-2">
                        {zardasHistory.slice(0, 3).map((entry: any) => (
                          <li key={entry.id} className="flex justify-between items-center rounded-lg bg-gray-50 p-3">
                            <div>
                              <div className="font-medium">{entry.type.replace('_', ' ')}</div>
                              <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString('es-ES')}</div>
                            </div>
                            <div className={`font-semibold ${entry.amount > 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                              {method.type === PaymentMethod.CARD && '💳 Tarjeta (en persona)'}
                              {method.type === PaymentMethod.CASH && '💵 Efectivo (en persona)'}
                            </span>
                            <div className="text-sm text-gray-600">
                              Pago al recibir el pedido
                            </div>
                          </div>

                        </div>
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

              {/* Botón de Confirmar */}
              <button
                onClick={handlePayment}
                disabled={loading || paymentProcessing}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {paymentProcessing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmando...
                  </span>
                ) : (
                  <span>Confirmar Pedido</span>
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
        {selectedMethod === PaymentMethod.CARD && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pago con Tarjeta</h3>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">
                  Pagarás con tarjeta al repartidor o en el bar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
