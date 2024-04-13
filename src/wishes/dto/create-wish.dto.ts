import { IsNotEmpty } from 'class-validator';

export class CreateWishDto {
    @IsNotEmpty()
    title: string;

    description: string;

    @IsNotEmpty()
    price: string;

    @IsNotEmpty()
    canBeAnon: boolean;

    @IsNotEmpty()
    isHidden: boolean;

    @IsNotEmpty()
    isReserved: boolean;

    @IsNotEmpty()
    picture?: string;

    @IsNotEmpty()
    userId: number;
}
