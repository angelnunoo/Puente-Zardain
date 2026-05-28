import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Query, 
  Param, 
  Body, 
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role, IncidenceType } from '../../../shared/enums';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createIncident(@Body() data: any, @Req() req: any) {
    return this.incidentsService.createIncident({
      ...data,
      userId: req.user.userId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getIncidents(
    @Query('status') status?: string,
    @Query('type') type?: IncidenceType,
    @Query('priority') priority?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.incidentsService.getIncidents({
      status,
      type,
      priority,
      userId,
      page,
      limit,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getIncidentById(@Param('id') id: string) {
    return this.incidentsService.getIncidentById(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateIncidentStatus(
    @Param('id') id: string,
    @Body() data: { status: string; adminNotes?: string }
  ) {
    return this.incidentsService.updateIncidentStatus(id, data.status, data.adminNotes);
  }

  @Post(':id/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async addIncidentResponse(
    @Param('id') id: string,
    @Body() data: { message: string; isInternal?: boolean; attachments?: string[] }
  ) {
    return this.incidentsService.addIncidentResponse(id, data);
  }

  @Put(':id/escalate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async escalateIncident(
    @Param('id') id: string,
    @Body() data: { reason: string }
  ) {
    return this.incidentsService.escalateIncident(id, data.reason);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getIncidentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.incidentsService.getIncidentStats(start, end);
  }

  @Post('auto-close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async autoCloseInactiveIncidents(@Body() data: { hoursInactive?: number }) {
    return this.incidentsService.autoCloseInactiveIncidents(data.hoursInactive);
  }
}
