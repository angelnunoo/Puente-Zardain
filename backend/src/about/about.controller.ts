import { Controller, Get } from '@nestjs/common';

@Controller('about')
export class AboutController {
  @Get('data')
  async getAboutData() {
    // Simular datos sobre el restaurante
    const aboutData = {
      title: 'Puente Zardain',
      description: 'Un restaurante con corazón y tradición familiar, donde cada hamburguesa cuenta una historia de pasión y sabor.',
      philosophy: 'Creemos en la comida hecha con amor, ingredientes frescos y recetas que han pasado de generación en generación. No solo cocinamos hamburguesas, creamos experiencias.',
      history: 'Puente Zardain nació en 2015 como un pequeño sueño familiar. Lo que comenzó como un modesto local se ha convertido en un referente para los amantes de las hamburguesas caseras. Nuestro nombre representa el puente entre la tradición familiar y la innovación culinaria, siempre con el toque especial que nos caracteriza.',
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
          bio: 'Con más de 20 años de experiencia en cocina, María es el corazón y alma de Puente Zardain. Su pasión por las hamburguesas caseras es lo que impulsa cada plato que servimos.'
        },
        {
          id: '2',
          name: 'Carlos Rodríguez',
          role: 'Chef de Cocina',
          image: '/images/team/carlos.jpg',
          bio: 'Especialista en carnes y salsas artesanales, Carlos aporta la perfección técnica y creatividad que hace únicas nuestras creaciones.'
        },
        {
          id: '3',
          name: 'Ana Martínez',
          role: 'Gerente de Experiencia',
          image: '/images/team/ana.jpg',
          bio: 'Ana asegura que cada visita a Puente Zardain sea memorable. Su atención al detalle y calidez humana hacen que todos se sientan como en casa.'
        },
        {
          id: '4',
          name: 'Luis Torres',
          role: 'Maestro de la Parrilla',
          image: '/images/team/luis.jpg',
          bio: 'Guardián de nuestras recetas secretas, Luis domina el arte de la parrilla perfecta. Cada hamburguesa que sale de sus manos es una obra maestra.'
        }
      ]
    };

    return aboutData;
  }
}
