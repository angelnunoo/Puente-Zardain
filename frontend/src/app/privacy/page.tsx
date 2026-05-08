'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function PrivacyPage() {
  const [consent, setConsent] = useState({
    marketing: false,
    analytics: false,
    cookies: false
  });
  const [requestType, setRequestType] = useState<'export' | 'delete' | 'correction' | 'restriction'>('export');
  const [requestReason, setRequestReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Cargar consentimientos actuales
    loadCurrentConsent();
  }, []);

  const loadCurrentConsent = async () => {
    try {
      const response = await fetch('/api/privacy/consent');
      const data = await response.json();
      setConsent(data);
    } catch (error) {
      console.error('Error cargando consentimientos:', error);
    }
  };

  const updateConsent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consent),
      });

      if (response.ok) {
        toast({
          title: 'Consentimientos actualizados',
          description: 'Tus preferencias de privacidad han sido guardadas.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar tus consentimientos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mis-datos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Datos exportados',
          description: 'Tus datos personales han sido descargados.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron exportar tus datos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitDataRequest = async () => {
    if (!requestReason.trim()) {
      toast({
        title: 'Error',
        description: 'Debes proporcionar una razón para tu solicitud.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType,
          reason: requestReason,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Solicitud enviada',
          description: 'Tu solicitud será procesada en los próximos días.',
        });
        setRequestReason('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo procesar tu solicitud.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Privacidad y RGPD</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          En Puente de Zardain respetamos tu privacidad y cumplimos con el RGPD. 
          Tienes control total sobre tus datos personales.
        </p>
      </div>

      {/* Consentimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Consentimientos de Privacidad</CardTitle>
          <CardDescription>
            Administra cómo usamos tus datos para diferentes propósitos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Marketing</h3>
                <p className="text-sm text-muted-foreground">
                  Enviarte ofertas personalizadas y promociones
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent(prev => ({ ...prev, marketing: e.target.checked }))}
                className="h-4 w-4"
                aria-label="Consentimiento de marketing"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Analizar cómo usas nuestra aplicación para mejorarla
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent(prev => ({ ...prev, analytics: e.target.checked }))}
                className="h-4 w-4"
                aria-label="Consentimiento de analytics"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Usar cookies para mejorar tu experiencia
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.cookies}
                onChange={(e) => setConsent(prev => ({ ...prev, cookies: e.target.checked }))}
                className="h-4 w-4"
                aria-label="Consentimiento de cookies"
              />
            </div>
          </div>

          <Button 
            onClick={updateConsent} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Guardando...' : 'Guardar Preferencias'}
          </Button>
        </CardContent>
      </Card>

      {/* Derechos RGPD */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exportar Datos</CardTitle>
            <CardDescription>
              Descarga todos tus datos personales en formato JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportData} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Exportando...' : 'Exportar Mis Datos'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eliminar Datos</CardTitle>
            <CardDescription>
              Solicita la eliminación permanente de tus datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setRequestType('delete')}
              variant="outline"
              className="w-full"
            >
              Solicitar Eliminación
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Corregir Datos</CardTitle>
            <CardDescription>
              Solicita corrección de información incorrecta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setRequestType('correction')}
              variant="outline"
              className="w-full"
            >
              Solicitar Corrección
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restringir Procesamiento</CardTitle>
            <CardDescription>
              Limita cómo procesamos tus datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setRequestType('restriction')}
              variant="outline"
              className="w-full"
            >
              Restringir Datos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de Solicitud */}
      {requestType !== 'export' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {requestType === 'delete' && 'Solicitud de Eliminación de Datos'}
              {requestType === 'correction' && 'Solicitud de Corrección de Datos'}
              {requestType === 'restriction' && 'Solicitud de Restricción de Datos'}
            </CardTitle>
            <CardDescription>
              Describe detalladamente tu solicitud y la procesaremos lo antes posible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="request-reason" className="block text-sm font-medium mb-2">
                Razón de la solicitud
              </label>
              <Textarea
                id="request-reason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Describe detalladamente tu solicitud..."
                rows={4}
                className="w-full"
                aria-label="Razón de la solicitud"
              />
            </div>

            <Button 
              onClick={submitDataRequest} 
              disabled={isLoading || !requestReason.trim()}
              className="w-full"
            >
              {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Información de Privacidad */}
      <Card>
        <CardHeader>
          <CardTitle>¿Qué datos recopilamos?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Datos Personales</h4>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Nombre y apellidos</li>
                <li>Correo electrónico</li>
                <li>Teléfono</li>
                <li>Dirección de entrega</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Datos de Transacción</h4>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Historial de pedidos</li>
                <li>Información de pagos</li>
                <li>Puntos Zardas ganados</li>
                <li>Transacciones de lealtad</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Datos de Uso</h4>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Preferencias de productos</li>
                <li>Historial de navegación</li>
                <li>Interacciones con la aplicación</li>
                <li>Soporte y incidencias</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Política de Retención */}
      <Card>
        <CardHeader>
          <CardTitle>Política de Retención de Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>
              <strong>Usuarios activos:</strong> Mantenemos tus datos mientras tu cuenta esté activa.
            </p>
            <p>
              <strong>Usuarios inactivos:</strong> Eliminamos datos personales después de 2 años de inactividad.
            </p>
            <p>
              <strong>Pedidos:</strong> Conservamos información de pedidos durante 5 años para fines fiscales.
            </p>
            <p>
              <strong>Soporte:</strong> Mantenemos registros de soporte durante 3 años.
            </p>
            <p>
              <strong>Usuarios eliminados:</strong> Guardamos datos anonimizados durante 30 días por requerimientos legales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contacto de Privacidad */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto de Privacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>
              Si tienes preguntas sobre privacidad o necesitas ejercer tus derechos RGPD, 
              puedes contactarnos:
            </p>
            <div className="space-y-1">
              <p><strong>Email:</strong> privacidad@puente-zardain.es</p>
              <p><strong>Teléfono:</strong> +34 900 123 456</p>
              <p><strong>DPO (Delegado de Protección de Datos):</strong> dpo@puente-zardain.es</p>
            </div>
            <p>
              Responderemos a tu solicitud en un plazo máximo de 30 días 
              según lo establecido en el RGPD.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
