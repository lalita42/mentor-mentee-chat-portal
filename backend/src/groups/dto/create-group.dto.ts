import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({
    each: true,
  })
  memberIds?: string[];
}
