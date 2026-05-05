'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  price: number
  ingredients: { name: string; required: boolean }[]
}

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('http://localhost:3001/products')
      .then(res => res.json())
      .then(setProducts)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Carta</h1>
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
            <button className="bg-green-500 text-white p-2 mt-2">Añadir al carrito</button>
          </div>
        ))}
      </div>
    </div>
  )
}