'use client'

import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { ordersApi, paymentsApi } from '../../lib/api'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '')

function StripePaymentSection({
  clientSecret,
  onSuccess,
  onError,
}: {
  clientSecret: string
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleConfirmPayment = async () => {
    if (!stripe || !elements) {
      onError('El sistema de pago aún no está listo.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError('Por favor, completa los datos de la tarjeta.')
      return
    }

    setProcessing(true)
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })
    setProcessing(false)

    if (result.error) {
      onError(result.error.message || 'No se pudo procesar el pago de la tarjeta.')
      return
    }

    if (result.paymentIntent?.status === 'succeeded') {
      onSuccess()
    } else {
      onError('El pago no se completó correctamente.')
    }
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Pago con tarjeta</h2>
      <div className="mb-4 rounded border border-gray-200 p-3">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleConfirmPayment}
        disabled={processing}
      >
        {processing ? 'Procesando pago...' : 'Confirmar pago'}
      </button>
    </div>
  )
}

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const { token } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [delivery, setDelivery] = useState(false)
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  const deliveryFeeMessage = useMemo(() => {
    if (!delivery) return 'Recogida en local.'
    return total < 20 ? 'Entrega a domicilio con coste adicional.' : 'Entrega a domicilio con tarifa reducida.'
  }, [delivery, total])

  const handleCheckout = async () => {
    if (!token) {
      setMessage('Necesitas iniciar sesión para realizar el pedido.')
      return
    }
    if (!items.length) {
      setMessage('Tu carrito está vacío.')
      return
    }
    if (delivery && !address.trim()) {
      setMessage('Indica una dirección de entrega.')
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        delivery,
        address: delivery ? address.trim() : undefined,
        paymentMethod,
      }

      const order = await ordersApi.createOrder(token, orderPayload)
      setLastOrderId(order.id)

      if (paymentMethod === 'CARD') {
        const payment = await paymentsApi.createIntent(token, order.id)
        if (payment.clientSecret) {
          setClientSecret(payment.clientSecret)
          setMessage('Pedido creado. Completa el pago con la tarjeta para finalizar.')
          return
        }
      }

      clearCart()
      setOrderConfirmed(true)
      setMessage('Pedido creado correctamente. Revisa tu perfil para el estado del pedido.')
    } catch (error) {
      setMessage((error as Error).message || 'No se pudo crear el pedido.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    clearCart()
    setClientSecret(null)
    setOrderConfirmed(true)
    setMessage('Pago realizado. Tu pedido está en proceso. Gracias.')
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Carrito</h1>
      {lastOrderId && orderConfirmed && (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-4 text-green-900">
          <p className="font-semibold">Pedido confirmado</p>
          <p className="mt-1">Tu pedido <strong>#{lastOrderId.slice(0, 8)}</strong> se ha registrado correctamente.</p>
          <p className="text-sm mt-2">Puedes ver el estado de tu pedido en <a href="/orders" className="font-semibold underline">Mis pedidos</a>.</p>
        </div>
      )}
      {items.length === 0 ? (
        <p className="mt-4 text-gray-600">Tu carrito está vacío.</p>
      ) : (
        <div className="space-y-4 mt-4">
          {items.map((item) => (
            <div key={item.productId} className="rounded border p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="font-semibold">{item.name}</h2>
                  <p className="text-sm text-gray-600">Precio unitario: {item.price}€</p>
                  <p className="text-sm text-gray-600">Subtotal: {item.price * item.quantity}€</p>
                </div>
                <button className="text-red-600 hover:text-red-800" onClick={() => removeItem(item.productId)}>
                  Eliminar
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded border px-3 py-1" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button className="rounded border px-3 py-1" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                  +
                </button>
              </div>
            </div>
          ))}

          <div className="rounded border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <div className="space-y-3">
              <p className="font-semibold">Total: {total}€</p>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={delivery} onChange={(event) => setDelivery(event.target.checked)} />
                  Entrega a domicilio
                </label>
                {delivery && (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección de entrega"
                    className="w-full rounded border p-2"
                  />
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1">Método de pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'CARD' | 'CASH')}
                    className="w-full rounded border p-2"
                  >
                    <option value="CARD">Tarjeta</option>
                    <option value="CASH">Efectivo</option>
                  </select>
                </div>
                <p className="text-sm text-gray-600">{deliveryFeeMessage}</p>
              </div>
              <button
                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Realizar Pedido'}
              </button>
            </div>
          </div>

          {clientSecret ? (
            <Elements stripe={stripePromise}>
              <StripePaymentSection
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={(message) => setMessage(message)}
              />
            </Elements>
          ) : lastOrderId && !orderConfirmed ? (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
              <p className="font-semibold">Pago pendiente</p>
              <p className="mt-1">Tu pedido <strong>#{lastOrderId.slice(0, 8)}</strong> está pendiente de pago.</p>
              <p className="text-sm mt-2">Completa el pago con tarjeta para confirmar tu pedido.</p>
            </div>
          ) : null}
        </div>
      )}
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  )
}
