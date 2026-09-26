import {
  IsMongoId,
} from 'class-validator';

export class MemberDto {
  @IsMongoId()
  userId: string;
}