'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { productsApi } from '../../../lib/api'
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '../../../../../shared/dtos'

export default function AdminProducts() {
  const { token } = useAuth()
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [categories, setCategories] = useState<{name: string, count: number}[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductResponseDto | null>(null)
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    stock: 50,
    active: true,
    ingredients: []
  })

  const loadProducts = async () => {
    try {
      if (!token) return
      setLoading(true)
      const [productsData, categoriesData, statsData] = await Promise.all([
        productsApi.getAll(token),
        productsApi.getCategories(token),
        productsApi.getStats(token)
      ])
      setProducts(productsData)
      setCategories(categoriesData)
      setStats(statsData)
      setLoading(false)
    } catch (err: any) {
      setLoading(false)
      setMessage(err.message || 'No se pudieron cargar los productos')
    }
  }

  useEffect(() => {
    loadProducts()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!token) return

      if (editingProduct) {
        await productsApi.update(token, editingProduct.id, formData)
        setMessage('Producto actualizado correctamente')
      } else {
        await productsApi.create(token, formData)
        setMessage('Producto creado correctamente')
      }

      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        image: '',
        stock: 50,
        active: true,
        ingredients: []
      })
      setShowCreateForm(false)
      setEditingProduct(null)
      loadProducts()
    } catch (err: any) {
      setMessage(err.message || 'Error al guardar producto')
    }
  }

  const handleEdit = (product: ProductResponseDto) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      image: product.image || '',
      stock: product.stock,
      active: product.active,
      ingredients: product.ingredients
    })
    setShowCreateForm(true)
  }

  const handleToggleActive = async (product: ProductResponseDto) => {
    try {
      if (!token) return
      await productsApi.toggleActive(token, product.id)
      setMessage(`Producto ${product.active ? 'desactivado' : 'activado'} correctamente`)
      loadProducts()
    } catch (err: any) {
      setMessage(err.message || 'Error al cambiar estado')
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return
    
    try {
      if (!token) return
      await productsApi.delete(token, productId)
      setMessage('Producto eliminado correctamente')
      loadProducts()
    } catch (err: any) {
      setMessage(err.message || 'Error al eliminar producto')
    }
  }

  const handleStockUpdate = async (productId: string, stock: number) => {
    try {
      if (!token) return
      await productsApi.updateStock(token, productId, { stock })
      setMessage('Stock actualizado correctamente')
      loadProducts()
    } catch (err: any) {
      setMessage(err.message || 'Error al actualizar stock')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Productos</h1>
          <p className="text-sm text-gray-600">Administra tu carta, precios y stock</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nuevo Producto
          </button>
          <a href="/admin" className="bg-gray-800 text-white px-4 py-2 rounded">
            Volver al panel
          </a>
        </div>
      </div>

      {message && (
        <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          {message}
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Productos</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Activos</h3>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Inactivos</h3>
            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Stock Bajo</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
          </div>
        </div>
      )}

      {/* Formulario de creación/edición */}
      {showCreateForm && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full rounded border p-2"
                  placeholder="Ej: Hamburguesas, Bebidas, Postres"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded border p-2"
                rows={3}
                placeholder="Describe el producto..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (€) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="w-full rounded border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Producto activo
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen (URL)
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                className="w-full rounded border p-2"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                {editingProduct ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingProduct(null)
                  setFormData({
                    name: '',
                    description: '',
                    price: 0,
                    category: '',
                    image: '',
                    stock: 50,
                    active: true,
                    ingredients: []
                  })
                }}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de productos */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Productos ({products.length})</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay productos registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{product.category}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">€{product.price.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={product.stock}
                          onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value))}
                          className="w-16 rounded border p-1 text-sm"
                        />
                        <span className={`text-sm font-medium ${
                          product.stock <= 10 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {product.stock <= 10 ? '⚠️ Bajo' : '✅ OK'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`text-sm ${
                            product.active 
                              ? 'text-orange-600 hover:text-orange-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {product.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
