import { IsNotEmpty } from 'class-validator';

export class CreateWishDto {
    @IsNotEmpty()
    title: string;

    description: string;

    @IsNotEmpty()
    price: number;

    @IsNotEmpty()
    canBeAnon: boolean;

    @IsNotEmpty()
    isHidden: boolean;

    @IsNotEmpty()
    isReserved: boolean;

    picture?: string;

    @IsNotEmpty()
    userId: number;
}
