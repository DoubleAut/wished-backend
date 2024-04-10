export class UpdateUserDto {
    id: number;
    email: string;
    password: string;
    name: string;
    surname: string;
    picture: string;
    isActive: boolean;
    followings: number;
    followers: number;
    wishes: number[];
}
