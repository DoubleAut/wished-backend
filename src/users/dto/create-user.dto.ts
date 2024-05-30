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

export interface PublicUserDTO {
    id: number;
    email: string;
    name: string;
    surname: string;
    picture: string;
    isActive: boolean;
    followings?: PublicUserDTO[];
    followers?: PublicUserDTO[];
    wishes?: Wish[];
}

export class CreatePublicUserDto implements PublicUserDTO {
    id: number;
    email: string;
    name: string;
    surname: string;
    picture: string;
    isActive: boolean;
    followers?: PublicUserDTO[];
    followings?: PublicUserDTO[];
    wishes?: Wish[];

    constructor(props: User) {
        const data = { ...props };

        delete data.password;

        return data;
    }
}
