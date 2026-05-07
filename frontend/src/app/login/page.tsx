'use client'

import { useState } from 'react';
import { authApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = await authApi.login({ email, password });
      signIn(data.access_token, data.refresh_token);
      window.location.href = '/menu';
    } catch (err) {
      setError((err as Error).message || 'Error en login');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="border p-2 w-full"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contrase�a"
          required
          className="border p-2 w-full"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          Iniciar Sesi�n
        </button>
      </form>
      <a href="/register" className="text-blue-500">
        Registrarse
      </a>
    </div>
  );
}
