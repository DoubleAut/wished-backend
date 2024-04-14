import { IsEmail, IsNotEmpty } from 'class-validator';
import { Wish } from '../../wishes/entities/wish.entity';
import { User } from '../entity/user.entity';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    surname: string;

    picture?: string;
}

interface PublicUserDTO {
    id: number;
    email: string;
    name: string;
    surname: string;
    picture: string;
    isActive: boolean;
    followings?: User[];
    followers?: User[];
    wishes?: Wish[];
}

export class CreatePublicUserDto implements PublicUserDTO {
    id: number;
    email: string;
    name: string;
    surname: string;
    picture: string;
    isActive: boolean;
    followers?: User[];
    followings?: User[];
    wishes?: Wish[];

    constructor({ password, ...user }: User) {
        return {
            ...this,
            ...user,
        };
    }
}
