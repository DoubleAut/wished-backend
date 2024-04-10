import { User } from 'src/users/entity/user.entity';

export class CreateWishDto {
    id: number;
    title: string;
    description: string;
    price: string;
    canBeAnon: boolean;
    isHidden: boolean;
    isReserved: boolean;
    picture?: string;
    userId: number;
    user?: User;
}
