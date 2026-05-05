'use client'

import { useState, useEffect } from 'react'

export default function Profile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3001/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setUser)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
      {user ? (
        <div className="space-y-2">
          <p>Nombre: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Teléfono: {user.phone}</p>
          <p>Zardas: {user.zardas} 🎖️</p>
          <p>Liga: {user.league}</p>
        </div>
      ) : (
        <p>Cargando perfil...</p>
      )}
    </div>
  )
}