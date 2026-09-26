import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema.js';
import { Message, MessageDocument } from '../messages/schemas/message.schema.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,

    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async createReport(messageId: string, reporterId: string, reason: string) {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const existing = await this.reportModel.findOne({
      messageId: new Types.ObjectId(messageId),

      reporterId: new Types.ObjectId(reporterId),

      resolved: false,
    });

    if (existing) {
      return existing;
    }

    return this.reportModel.create({
      messageId: new Types.ObjectId(messageId),

      reporterId: new Types.ObjectId(reporterId),

      reason,
    });
  }

  async findAll() {
    return this.reportModel
      .find()
      .populate('messageId', 'content senderId groupId type deleted createdAt')
      .populate('reporterId', 'name email role')
      .sort({
        createdAt: -1,
      });
  }

  async resolve(reportId: string) {
    const report = await this.reportModel.findByIdAndUpdate(
      reportId,
      {
        resolved: true,
      },
      {
        new: true,
      },
    );

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }
}
