import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

export type DomainEventPayload = Record<string, unknown>;

@Injectable()
export class EventBusService {
  private readonly emitter = new EventEmitter();

  emit(event: string, payload: DomainEventPayload) {
    this.emitter.emit(event, payload);
  }

  on(event: string, listener: (payload: DomainEventPayload) => void) {
    this.emitter.on(event, listener);
  }
}
