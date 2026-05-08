'use client'

import MenuSectionFixed from '../components/home/menu-section-fixed'

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nuestra Carta</h1>
              <p className="text-sm text-gray-600">Los mejores platos de Puente de Zardain</p>
            </div>
            <div className="flex gap-2">
              <a href="/cart" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                🛒 Carrito
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full" id="cart-count">0</span>
              </a>
              <a href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                🔐 Login
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Componente MenuSection con conexión real a APIs */}
      <MenuSectionFixed />
    </div>
  )
}