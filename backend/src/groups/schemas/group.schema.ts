import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

export type GroupDocument = HydratedDocument<Group>;

@Schema({
  timestamps: true,
})
export class Group {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
  })
  members: Types.ObjectId[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
