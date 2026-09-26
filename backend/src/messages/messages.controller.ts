import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { CreateMessageDto } from './dto/create.message.dto.js';
import { MessagesService } from './messages.service.js';
import { ReportsService } from '../reports/reports.service.js';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get()
  getMessages(
    @Req() req: any,
    @Query('groupId') groupId?: string,
    @Query('otherUserId')
    otherUserId?: string,
  ) {
    return this.messagesService.getHistory(req.user, groupId, otherUserId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(req.user, dto);
  }

  @Patch(':id/pin')
  @Roles(Role.ADMIN, Role.MENTOR)
  pin(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.togglePin(id, req.user);
  }

  @Patch(':id/doubt')
  markDoubt(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.toggleDoubt(id, req.user);
  }

  @Patch(':id/announcement')
  @Roles(Role.ADMIN, Role.MENTOR)
  announcement(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.toggleAnnouncement(id, req.user);
  }

  @Delete(':id')
  deleteMessage(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.remove(id, req.user);
  }

  @Post(':id/file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',

        filename: (req, file, callback) => {
          const extension = extname(file.originalname);

          callback(null, `${randomUUID()}${extension}`);
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (req, file, callback) => {
        const allowed = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ];

        if (allowed.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Only JPG, PNG, WEBP and PDF are allowed'), false);
        }
      },
    }),
  )
  uploadFile(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.messagesService.attachFile(id, req.user, file);
  }

  @Post(':id/report')
  report(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.reportsService.createReport(id, req.user.id, reason);
  }
}
