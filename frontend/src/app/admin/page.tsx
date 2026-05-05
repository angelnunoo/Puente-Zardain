'use client'

export default function Admin() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Panel Admin</h1>
      <p>Estado de la cocina: Abierta</p>
      <button className="bg-red-500 text-white p-2">Cambiar a Cerrada</button>
    </div>
  )
}