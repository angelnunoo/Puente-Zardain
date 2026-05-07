'use client'

import { useState } from 'react';
import { authApi } from '../../lib/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await authApi.register({ email, phone, password, name });
      setSuccess(true);
      setError(null);
    } catch (err) {
      setSuccess(false);
      setError((err as Error).message || 'Error en registro');
    }
  };

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
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">Registro exitoso. Ya puede iniciar sesión.</p>}
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          Registrarse
        </button>
      </form>
      <a href="/login" className="text-blue-500">
        Iniciar Sesión
      </a>
    </div>
  );
}
