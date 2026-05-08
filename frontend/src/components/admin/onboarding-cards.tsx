'use client';

import React, { useState, useEffect } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function OnboardingCards() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  useEffect(() => {
    // Simular obtención de pasos de onboarding desde backend
    const fetchOnboardingSteps = async () => {
      try {
        const response = await fetch('/api/admin/onboarding/steps');
        if (response.ok) {
          const data = await response.json();
          setSteps(data);
        } else {
          // Fallback con pasos simulados
          const mockSteps: OnboardingStep[] = [
            {
              id: '1',
              title: 'Configura tus horarios',
              description: 'Establece cuándo abres y cierras para que tus clientes sepan cuándo pueden pedir',
              icon: '🕐',
              action: 'Configurar horarios',
              completed: false,
              priority: 'high'
            },
            {
              id: '2',
              title: 'Revisa tu carta',
              description: 'Asegúrate de que todos tus productos estén disponibles con los precios correctos',
              icon: '📋',
              action: 'Ver carta',
              completed: false,
              priority: 'high'
            },
            {
              id: '3',
              title: 'Activa los pedidos online',
              description: 'Una vez listo, activa el sistema para empezar a recibir pedidos',
              icon: '🚀',
              action: 'Activar pedidos',
              completed: false,
              priority: 'high'
            }
          ];
          setSteps(mockSteps);
        }
      } catch (error) {
        console.error('Error fetching onboarding steps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingSteps();
  }, []);

  const handleStepAction = (stepId: string) => {
    // Simular acción del paso
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    setCurrentStep(stepId);
    
    // Aquí se redirigiría a la página correspondiente
    console.log(`Ejecutando acción para paso ${stepId}`);
  };

  const getStepConfig = (priority: OnboardingStep['priority']) => {
    switch (priority) {
      case 'high':
        return {
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'medium':
        return {
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'low':
        return {
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return {
          borderColor: 'border-gray-200',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-6xl mb-4">🚀</div>
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Bienvenido a Puente de Zardain! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Configura tu restaurante en 3 pasos sencillos
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{completedSteps} de {totalSteps} completados</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step) => {
            const config = getStepConfig(step.priority);
            
            return (
              <div
                key={step.id}
                className={`${config.borderColor} ${config.bgColor} border-2 rounded-xl p-8 relative transition-all duration-300 hover:shadow-xl ${
                  step.completed ? 'opacity-75' : ''
                } ${
                  currentStep === step.id ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
                }`}
              >
                {/* Completed Badge */}
                {step.completed && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className="text-6xl mb-6 text-center">
                  {step.icon}
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className={`text-xl font-bold ${config.textColor} mb-4`}>
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handleStepAction(step.id)}
                    disabled={step.completed}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                      step.completed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `${config.buttonColor} text-white`
                    }`}
                  >
                    {step.completed ? 'Completado' : step.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {completedSteps === totalSteps && (
          <div className="text-center bg-green-50 border-2 border-green-200 rounded-xl p-8">
            <div className="text-6xl mb-4">🎊</div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              ¡Todo listo para empezar!
            </h2>
            <p className="text-green-700 mb-6">
              Tu restaurante está configurado y listo para recibir pedidos
            </p>
            <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
              Ir al panel principal
            </button>
          </div>
        )}

        {/* Help Section */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            ¿Necesitas ayuda? Estamos aquí para ti
          </p>
          <div className="flex justify-center gap-4">
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Ver tutorial
            </button>
            <span className="text-gray-400">•</span>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Contactar soporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
