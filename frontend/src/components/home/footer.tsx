'use client';

import React, { useState, useEffect } from 'react';

interface FooterData {
  address: string;
  phone: string;
  email: string;
  hours: {
    weekdays: string;
    weekend: string;
  };
  social: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  rating: {
    google: number;
    totalReviews: number;
  };
  legalInfo?: {
    restaurantName: string;
    cif: string;
    license: string;
  };
}

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/restaurant/footer`);
        if (response.ok) {
          const data = await response.json();
          setFooterData(data);
        } else {
          throw new Error('Error al cargar datos del restaurante');
        }
      } catch (error) {
        console.error('Error fetching footer data:', error);
        setError('No se pudieron cargar los datos del restaurante');
        
        // Fallback con datos realistas
        const fallbackData: FooterData = {
          address: 'Calle de la Constitución, 15, 28001 Madrid',
          phone: '+34 915 234 567',
          email: 'hola@puentedezardain.com',
          hours: {
            weekdays: '12:00 - 23:00',
            weekend: '12:00 - 00:00'
          },
          social: {
            instagram: '@puentedezardain',
            facebook: 'Puente de Zardain',
            twitter: '@puentedezardain'
          },
          rating: {
            google: 4.8,
            totalReviews: 342
          }
        };
        setFooterData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  if (loading) {
    return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-pulse">
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </footer>
    );
  }

  if (!footerData) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-white">
      {/* Valoración destacada */}
      <div className="bg-blue-600 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 2.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-3xl font-bold ml-2">{footerData.rating.google}</span>
              </div>
              <div>
                <div className="text-sm opacity-90">Valoración Google</div>
                <div className="text-xs opacity-75">{footerData.rating.totalReviews} reseñas</div>
              </div>
            </div>
            
            <button
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              onClick={() => {
                window.open('https://g.page/puente-de-zardain', '_blank');
              }}
            >
              Dejar reseña
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal del footer */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Información de contacto */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Contacto
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">Dirección</div>
                    <div className="text-gray-300 text-sm">{footerData.address}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257-1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493-1.498A1 1 0 0121.28 3V5z" />
                  </svg>
                  <div>
                    <div className="font-medium">Teléfono</div>
                    <div className="text-gray-300 text-sm">{footerData.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-gray-300 text-sm">{footerData.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Horarios
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium mb-1">Lunes - Viernes</div>
                  <div className="text-gray-300 text-sm">{footerData.hours.weekdays}</div>
                </div>
                
                <div>
                  <div className="font-medium mb-1">Sábado - Domingo</div>
                  <div className="text-gray-300 text-sm">{footerData.hours.weekend}</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3 mt-4">
                  <div className="text-sm text-yellow-400 font-medium">
                    ⚠️ Cerrado los lunes
                  </div>
                </div>
              </div>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 005.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Enlaces
              </h3>
              <div className="space-y-3">
                <a
                  href="/carta"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  Nuestra carta
                </a>
                <a
                  href="/sobre-nosotros"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  Sobre nosotros
                </a>
                <a
                  href="/contacto"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  Contacto
                </a>
                <a
                  href="/aviso-legal"
                  className="block text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Aviso legal
                </a>
                <a
                  href="/privacidad"
                  className="block text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Política de privacidad
                </a>
              </div>
            </div>

            {/* Redes sociales */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 4.715A5.002 5.002 0 015.356 15.857M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Síguenos
              </h3>
              <div className="space-y-3">
                <a
                  href={`https://instagram.com/${footerData.social.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 9.846 2.265 9.846 6.812 0 1.34-.305 2.602-.848 3.726l.075.099c.1.143.21.26.29.426.08.217.173.473.274.758.097.328.182.68.261 1.053.09.375.207.753.376 1.154.09.402.233.832.376 1.282.062.262.165.553.236.872.065.324.142.676.236 1.061.099.424.231.864.376 1.401.086.398.192.834.376 1.381.08.393.192.831.376 1.381.08.393.192.831.376 1.381-1.419 2.767-3.861 2.767-6.812 0-4.547-6.642-9.846-6.812-3.204 0-9.846-2.265-9.846-6.812 0-1.34.305-2.602-.848-3.726l-.075-.099c-.1-.143-.21-.26-.29-.426-.08-.217-.173-.473-.274-.758-.097-.328-.182-.68-.261-1.053-.09-.375-.207-.753-.376-1.154-.09-.402-.233-.832-.376-1.282-.062-.262-.165-.553-.236-.872-.065-.324-.142-.676-.236-1.061-.099-.424-.231-.864-.376-1.401-.086-.398-.192-.834-.376-1.381-.08-.393-.192-.831-.376-1.381z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
                
                <a
                  href={`https://facebook.com/${footerData.social.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-7.854h-3.375v4.626h3.375v2.228c0 3.213-2.022 4.835-4.835 4.835-1.305 0-2.404-.396-2.76-.696v2.978h2.446c.789 0 1.438-.699 1.438-1.552 0-2.83-2.754-5.098-6.139-5.098z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
                
                <a
                  href={`https://twitter.com/${footerData.social.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.748l-.846 1.698a.5.5 0 00.54.632l1.698-.847a10 10 0 01.748 2.825l-1.698.846a.5.5 0 00-.632-.54l.846-1.698a10 10 0 012.825-.748l1.698.846a.5.5 0 00.54-.632l-.847-1.698a10 10 0 00-.748-2.825zM17.39 17.848l-1.698-.846a.5.5 0 00-.632.54l.846 1.698a10 10 0 01-2.825.748l1.698.846a.5.5 0 00.632-.54l-.846-1.698a10 10 0 012.825-.748zM8.46 8.46l-1.698-.846a.5.5 0 00-.632.54l.846 1.698a10 10 0 012.825-.748l1.698.846a.5.5 0 00.632-.54l-.846-1.698a10 10 0 00-2.825-.748zM12 12l-1.698-.846a.5.5 0 00-.632.54l.846 1.698a10 10 0 002.825-.748l1.698.846a.5.5 0 00.632-.54l-.846-1.698a10 10 0 00-2.825-.748z"/>
                  </svg>
                  <span>Twitter</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje humano y agradecimiento */}
      <div className="bg-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3s1.57 0 3.42.57C14.18 3.57 16.58 3 19.5 3c1.74 0 3.41.81 4.5 2.09C24.59 5.22 25 6.31 25 7.5c25 9.99 20.59 15.36 12.45 20.05L12 21.35z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">
              Gracias por apoyar un negocio local
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              Cada pedido que realizas nos ayuda a seguir haciendo lo que más nos gusta: 
              cocinar con amor y compartir tradición. Tu apoyo significa el mundo para nosotros.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => {
                  window.location.href = '/carta';
                }}
              >
                Pedir ahora
              </button>
              
              <button
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                onClick={() => {
                  window.location.href = '/reserva';
                }}
              >
                Reservar mesa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-950 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
            <div>
              © 2024 Puente de Zardain. Todos los derechos reservados.
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="/aviso-legal" className="hover:text-white transition-colors">
                Aviso legal
              </a>
              <a href="/privacidad" className="hover:text-white transition-colors">
                Privacidad
              </a>
              <a href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
