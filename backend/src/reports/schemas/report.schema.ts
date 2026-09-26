import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type ReportDocument = HydratedDocument<Report>;
@Schema({
  timestamps: true,
})
export class Report {
  @Prop({
    type: Types.ObjectId,
    ref: 'Message',
    required: true,
  })
  messageId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  reporterId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  reason: string;

  @Prop({
    default: false,
  })
  resolved: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
