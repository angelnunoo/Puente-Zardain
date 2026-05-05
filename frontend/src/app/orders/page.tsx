'use client'

import { useState, useEffect } from 'react'

interface Order {
  id: string
  status: string
  items: any[]
  total: number
  createdAt: string
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3001/orders', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setOrders)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mis Pedidos</h1>
      {orders.length === 0 ? (
        <p>No tienes pedidos</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border p-4 rounded">
              <h2 className="font-bold">Pedido #{order.id.slice(0, 8)}</h2>
              <p>Estado: {order.status}</p>
              <p>Total: {order.total}€</p>
              <p>Fecha: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}