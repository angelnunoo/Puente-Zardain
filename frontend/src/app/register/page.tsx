'use client'

import { useState } from 'react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const res = await fetch('http://localhost:3001/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, password, name }),
    })
    const data = await res.json()
    if (data.id) {
      alert('Registro exitoso')
      window.location.href = '/login'
    } else {
      alert('Error en registro')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Registro</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          required
          className="border p-2 w-full"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="border p-2 w-full"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Teléfono"
          required
          className="border p-2 w-full"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">Registrarse</button>
      </form>
      <a href="/login" className="text-blue-500">Iniciar Sesión</a>
    </div>
  )
}