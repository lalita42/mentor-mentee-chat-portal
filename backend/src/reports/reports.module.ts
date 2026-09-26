import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema.js';
import { Message, MessageSchema } from '../messages/schemas/message.schema.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Report.name,
        schema: ReportSchema,
      },
      {
        name: Message.name,
        schema: MessageSchema,
      },
    ]),
  ],
  controllers: [ReportsController],

  providers: [ReportsService],

  exports: [ReportsService],
})
export class ReportsModule {}
