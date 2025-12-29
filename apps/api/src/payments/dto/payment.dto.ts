import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;
}

export class CardDetailsDto {
  @IsString()
  @Matches(/^\d{16}$/, { message: 'Card number must be 16 digits' })
  cardNumber: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, { message: 'Expiry must be MM/YY' })
  expiryDate: string;

  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'CVC must be 3 or 4 digits' })
  cvc: string;

  @IsString()
  @IsNotEmpty()
  cardHolderName: string;
}

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsNotEmpty()
  cardDetails: CardDetailsDto;
}
