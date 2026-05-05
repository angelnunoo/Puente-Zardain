'use client'

export default function Cart() {
  // Simple cart, in real app use context or redux
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Carrito</h1>
      <p>Carrito vacío</p>
      <button className="bg-blue-500 text-white p-2">Realizar Pedido</button>
    </div>
  )
}