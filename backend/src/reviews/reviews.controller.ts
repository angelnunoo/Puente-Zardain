import { Controller, Get, Post, Body } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  create(@Body() body: any) {
    return this.reviewsService.create(body);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }
}