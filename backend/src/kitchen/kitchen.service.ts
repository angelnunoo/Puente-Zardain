import { BadRequestException, Injectable } from '@nestjs/common';

type KitchenMode = 'open' | 'closed' | 'saturated';

@Injectable()
export class KitchenService {
  private status: KitchenMode = 'open';

  getStatus() {
    return this.status;
  }

  setStatus(status: string) {
    if (!['open', 'closed', 'saturated'].includes(status)) {
      throw new BadRequestException('Invalid kitchen status');
    }
    this.status = status as KitchenMode;
  }
}