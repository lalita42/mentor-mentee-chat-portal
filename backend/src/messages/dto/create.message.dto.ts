import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

import { ChatType, MessageType } from '../../common/enums.js';

export class CreateMessageDto {
  @IsEnum(ChatType)
  chatType: ChatType;

  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @IsOptional()
  @IsMongoId()
  recipientId?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsMongoId()
  replyTo?: string;
}
