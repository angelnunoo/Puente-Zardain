import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../shared/enums';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() body: CreateReviewDto) {
    return this.reviewsService.create(req.user?.userId, {
      rating: body.rating,
      comment: body.comment,
    });
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/respond')
  respond(@Param('id') id: string, @Body('response') response: string) {
    return this.reviewsService.respond(id, response);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/hide')
  hide(@Param('id') id: string, @Body('hidden') hidden: boolean) {
    return this.reviewsService.hide(id, hidden);
  }
}
