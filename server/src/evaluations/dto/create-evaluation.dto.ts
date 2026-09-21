import {
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateEvaluationDto {
  @IsUUID()
  evaluateeId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  feedback?: string;
}
