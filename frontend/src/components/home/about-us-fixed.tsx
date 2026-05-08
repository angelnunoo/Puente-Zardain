'use client';

import React, { useState, useEffect } from 'react';
import { aboutApi } from '../../lib/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
}

interface AboutData {
  title: string;
  description: string;
  philosophy: string;
  history: string;
  images: string[];
  team: TeamMember[];
}

export default function AboutUsFixed() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Conexión REAL con backend a través de aboutApi
        const data = await aboutApi.getAboutData();
        
        if (data) {
          setAboutData(data);
        } else {
          throw new Error('No se pudieron obtener los datos sobre nosotros');
        }
      } catch (error) {
        console.error('Error fetching about data:', error);
        setError('No se puede cargar la información sobre nosotros');
        
        // Lógica fallback solo si falla la API
        const mockData: AboutData = {
          title: 'Puente Zardain',
          description: 'Un restaurante con corazón y tradición familiar, donde cada hamburguesa cuenta una historia de pasión y sabor.',
          philosophy: 'Creemos en la comida hecha con amor, ingredientes frescos y recetas que han pasado de generación en generación.',
          history: 'Puente Zardain nació en 2015 como un pequeño sueño familiar. Lo que comenzó como un modesto local se ha convertido en un referente para los amantes de las hamburguesas caseras.',
          images: [
            '/images/about/restaurant-front.jpg',
            '/images/about/kitchen-team.jpg',
            '/images/about/family-dinner.jpg'
          ],
          team: [
            {
              id: '1',
              name: 'María González',
              role: 'Fundadora & Chef Ejecutiva',
              image: '/images/team/maria.jpg',
              bio: 'Con más de 20 años de experiencia en cocina, María es el corazón y alma de Puente Zardain.'
            },
            {
              id: '2',
              name: 'Carlos Rodríguez',
              role: 'Chef de Cocina',
              image: '/images/team/carlos.jpg',
              bio: 'Especialista en carnes y salsas artesanales, Carlos aporta la perfección técnica y creatividad.'
            }
          ]
        };
        
        setAboutData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Cargando información sobre nosotros...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-red-800">Error de conexión</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!aboutData) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Sobre {aboutData.title}</h3>
        <p className="text-gray-600 leading-relaxed mb-6">
          {aboutData.description}
        </p>
      </div>

      {/* Galería de imágenes */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Nuestro Espacio</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aboutData.images.map((image, index) => (
            <div 
              key={index}
              className="aspect-video bg-gray-100 rounded-lg overflow-hidden"
            >
              <img 
                src={image}
                alt={`Imagen ${index + 1} del restaurante`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300/f3f4f6/6b7280?text=Restaurante';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Filosofía */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Nuestra Filosofía</h4>
        <p className="text-gray-700 leading-relaxed">
          {aboutData.philosophy}
        </p>
      </div>

      {/* Historia */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Nuestra Historia</h4>
        <p className="text-gray-700 leading-relaxed">
          {aboutData.history}
        </p>
      </div>

      {/* Equipo */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-6">El Equipo Puente Zardain</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aboutData.team.map((member) => (
            <div 
              key={member.id}
              className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0">
                <img 
                  src={member.image}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/80x80/f3f4f6/6b7280?text=Miembro';
                  }}
                />
              </div>
              
              <div className="flex-1">
                <h5 className="font-semibold text-gray-800 text-lg mb-1">
                  {member.name}
                </h5>
                <p className="text-sm font-medium text-blue-600 mb-2">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Llamada a la acción */}
      <div className="mt-8 text-center p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
        <h4 className="text-white text-xl font-semibold mb-2">
          ¿Listo para probar la experiencia Puente Zardain?
        </h4>
        <p className="text-white/90 mb-4">
          Visítanos y descubre por qué somos más que un restaurante
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.location.href = '/menu'}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Ver Nuestra Carta
          </button>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition-colors"
          >
            Contactar
          </button>
        </div>
      </div>
    </div>
  );
}
