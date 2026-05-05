import { Injectable } from '@nestjs/common';

@Injectable()
export class KitchenService {
  private status = 'open'; // open, closed, saturated

  getStatus() {
    return this.status;
  }

  setStatus(status: string) {
    this.status = status;
  }
}