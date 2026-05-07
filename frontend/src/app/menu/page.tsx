'use client'

import { useEffect, useState } from 'react'
import { ordersApi, productsApi, scheduleApi } from '../../lib/api'
import { useCart } from '../../context/CartContext'

interface Product {
  id: string
  name: string
  price: number
  ingredients: { name: string; required: boolean }[]
}

export default function Menu() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [scheduleMessage, setScheduleMessage] = useState<string>('Cargando estado...')
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [estimateMessage, setEstimateMessage] = useState<string>('Calculando tiempos...')

  useEffect(() => {
    productsApi.getAll()
      .then(setProducts)
      .catch(() => setProducts([]))

    scheduleApi.getPublicSchedule()
      .then((schedule) => {
        setIsOpen(schedule.status.open)
        if (schedule.status.open) {
          setScheduleMessage(schedule.status.reason)
          ordersApi.getEstimate()
            .then((estimate) => {
              setEstimateMessage(`Tiempo estimado: ${estimate.estimatedMinutes} min · Cola: ${estimate.queueLength}`)
            })
            .catch(() => {
              setEstimateMessage('No se pudo calcular el tiempo estimado.');
            })
        } else {
          const next = schedule.status.nextOpen ? ` → Abre a las ${schedule.status.nextOpen}` : ''
          setScheduleMessage(`${schedule.status.reason}${next}`)
          setEstimateMessage('No hay servicio en este momento.')
        }
      })
      .catch(() => {
        setScheduleMessage('No se pudo cargar el horario.')
        setEstimateMessage('No se pudo calcular el tiempo estimado.')
      })
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Carta</h1>
      <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-4">
        <p className="font-semibold">Estado de servicio:</p>
        <p className={isOpen ? 'text-green-700' : 'text-red-700'}>{scheduleMessage}</p>
        <p className="mt-2 text-sm text-gray-600">{estimateMessage}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="border p-4">
            <h2 className="font-bold">{product.name}</h2>
            <p>{product.price}€</p>
            <ul>
              {product.ingredients.map((ing, i) => (
                <li key={i}>{ing.required ? '*' : ''}{ing.name}</li>
              ))}
            </ul>
            <button
              className="bg-green-500 text-white p-2 mt-2"
              onClick={() => addItem({ productId: product.id, name: product.name, price: product.price })}
            >
              Añadir al carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}