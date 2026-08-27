import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator'

export class RegisterDto {
  @IsString() @Matches(/^[a-zA-Z0-9_.-]{3,64}$/) username!: string
  @IsString() @Length(12, 128) password!: string
}
export class LoginDto {
  @IsString() @Length(1, 64) username!: string
  @IsString() @Length(1, 128) password!: string
}
export class ChangePasswordDto { @IsString() @Length(12, 128) password!: string }
export class NamedItemDto { @IsString() @Length(1, 180) name!: string; @IsOptional() @IsString() @MaxLength(1000) note?: string }

export class ServiceDto {
  @IsIn(['BIDDING', 'COST', 'SUPERVISION', 'OTHER']) serviceType!: 'BIDDING' | 'COST' | 'SUPERVISION' | 'OTHER'
  @IsString() @Length(1, 160) stage!: string
  @IsString() ownerId!: string
  @IsOptional() @IsString() @MaxLength(500) otherDescription?: string
}
export class ProjectDto {
  @IsString() @Length(1, 240) name!: string
  @IsString() clientId!: string
  @IsString() ownerId!: string
  @IsIn(['ACTIVE', 'COMPLETED', 'CANCELLED']) status!: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  @Type(() => Number) @IsInt() @Min(2000) @Max(2100) businessYear!: number
  @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => ServiceDto) services!: ServiceDto[]
  @IsOptional() @IsString() @MaxLength(100) projectNo?: string
  @IsOptional() @IsDateString() startDate?: string
  @IsOptional() @IsDateString() plannedEndDate?: string
  @IsOptional() @IsDateString() actualEndDate?: string
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999999999) targetAmount?: number
  @IsOptional() @IsString() @MaxLength(4000) note?: string
}
export class FinanceDto {
  @IsOptional() @IsString() projectId?: string
  @IsOptional() @IsString() contractId?: string
  @IsOptional() @IsString() @Length(1, 120) contractNo?: string
  @IsOptional() @IsString() @Length(1, 120) invoiceNo?: string
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(9999999999999999) amount!: number
  @IsOptional() @IsDateString() signedDate?: string
  @IsOptional() @IsDateString() expectedPaymentDate?: string
  @IsOptional() @IsDateString() invoiceDate?: string
  @IsOptional() @IsDateString() paymentDate?: string
  @IsOptional() @IsString() @MaxLength(2000) note?: string
}
export class QuickUpdateDto {
  @IsOptional() @IsIn(['ACTIVE', 'COMPLETED', 'CANCELLED']) status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  @IsOptional() @IsString() @MaxLength(4000) note?: string
}
export class ProjectQueryDto {
  @IsOptional() @IsString() status?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100) businessYear?: number
  @IsOptional() @IsString() clientId?: string
  @IsOptional() @IsString() serviceType?: string
  @IsOptional() @IsString() q?: string
  @IsOptional() @IsString() hasRisk?: string
}
