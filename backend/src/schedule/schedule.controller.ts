import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../shared/enums';
import { CreateScheduleWindowDto, UpdateScheduleWindowDto } from './dto/window.dto';
import { CreateSpecialScheduleDto, UpdateSpecialScheduleDto } from './dto/special.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('public')
  getPublicSchedule() {
    return this.scheduleService.getPublicSchedule();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  getAdminSchedule() {
    return this.scheduleService.getAdminSchedule();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('window')
  createWindow(@Body() payload: CreateScheduleWindowDto) {
    return this.scheduleService.createWindow(payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('window/:id')
  updateWindow(@Param('id') id: string, @Body() payload: UpdateScheduleWindowDto) {
    return this.scheduleService.updateWindow(id, payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('window/:id')
  deleteWindow(@Param('id') id: string) {
    return this.scheduleService.deleteWindow(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('special')
  createSpecial(@Body() payload: CreateSpecialScheduleDto) {
    return this.scheduleService.createSpecial(payload as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('special/:id')
  updateSpecial(@Param('id') id: string, @Body() payload: UpdateSpecialScheduleDto) {
    return this.scheduleService.updateSpecial(id, payload as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('special/:id')
  deleteSpecial(@Param('id') id: string) {
    return this.scheduleService.deleteSpecial(id);
  }
}
