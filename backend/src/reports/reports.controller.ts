import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { ReportsService } from './reports.service.js';

class CreateReportDto {
  @IsString()
  @MinLength(3)
  reason: string;

  @IsString()
  messageId: string;
}
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateReportDto) {
    const messageId = dto.messageId;

    return this.reportsService.createReport(messageId, req.user.id, dto.reason);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.reportsService.findAll();
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN)
  resolve(@Param('id') id: string) {
    return this.reportsService.resolve(id);
  }
}
