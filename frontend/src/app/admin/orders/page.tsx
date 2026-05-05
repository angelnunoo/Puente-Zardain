'use client'

import { useState, useEffect } from 'react'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3001/orders', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setOrders)
  }, [])

  const updateStatus = async (orderId: string, status: string) => {
    const token = localStorage.getItem('token')
    await fetch(`http://localhost:3001/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status }),
    })
    // Refetch
    const res = await fetch('http://localhost:3001/orders', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    setOrders(await res.json())
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pedidos Activos</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">ID</th>
            <th className="p-2">Cliente</th>
            <th className="p-2">Total</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order: any) => (
            <tr key={order.id} className="border-t">
              <td className="p-2">{order.id.slice(0, 8)}</td>
              <td className="p-2">{order.user?.name}</td>
              <td className="p-2">{order.total}€</td>
              <td className="p-2">{order.status}</td>
              <td className="p-2 space-x-2">
                <button 
                  onClick={() => updateStatus(order.id, 'PREPARING')}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Preparando
                </button>
                <button 
                  onClick={() => updateStatus(order.id, 'READY')}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Listo
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}