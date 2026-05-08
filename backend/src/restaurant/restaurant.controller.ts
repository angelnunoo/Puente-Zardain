import { Controller, Get } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get('footer')
  getFooterData() {
    return this.restaurantService.getFooterData();
  }

  @Get('info')
  getRestaurantInfo() {
    return this.restaurantService.getRestaurantInfo();
  }
}
