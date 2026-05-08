import { Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantService {
  getFooterData() {
    return {
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
      },
      legalInfo: {
        restaurantName: 'Puente de Zardain',
        cif: 'B-12345678',
        license: 'Licencia de Actividad: 280123456'
      }
    };
  }

  getRestaurantInfo() {
    return {
      name: 'Puente de Zardain',
      description: 'Restaurante tradicional madrileño especializado en cocina casera con productos de proximidad',
      founded: 1985,
      capacity: 85,
      specialties: [
        'Cocina tradicional madrileña',
        'Productos de temporada',
        'Vinos españoles',
        'Postres caseros'
      ],
      features: [
        'Terraza climatizada',
        'Salón privado para eventos',
        'Menú del día',
        'Cocina para celíacos',
        'Accesibilidad completa'
      ]
    };
  }
}
