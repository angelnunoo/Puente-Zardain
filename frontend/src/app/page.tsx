export default function Home() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Bienvenido a Puente de Zardain</h1>
      <div className="space-x-4">
        <a href="/menu" className="text-blue-500">Ver Carta</a>
        <a href="/cart" className="text-blue-500">Ver Carrito</a>
        <a href="/login" className="text-blue-500">Login</a>
      </div>
    </main>
  )
}