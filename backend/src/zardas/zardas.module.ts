import { Module } from '@nestjs/common';
import { ZardasService } from './zardas.service';
import { ZardasController } from './zardas.controller';

@Module({
  providers: [ZardasService],
  controllers: [ZardasController],
  exports: [ZardasService],
})
export class ZardasModule {}