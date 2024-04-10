import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { CreatePublicUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';
import { hashPassword } from './helpers/service';

interface CreateProps {
    email: string;
    password: string;
    name: string;
    surname: string;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    private async updateFriendFollowers(userId: number, friendId: number) {
        const user = await User.withFriends(await User.findUserById(userId));
        const friend = await User.withFriends(
            await User.findUserById(friendId),
        );

        user.followers.push(friend);

        this.usersRepository.save(user);
    }

    private async addFriend(user: User, friendId: number) {
        const friend = await User.findUserById(friendId);
        const isIncluded = user.followings.find(
            (friend) => friend.id === friendId,
        );

        if (!isIncluded) {
            user.followings.push(friend);

            this.updateFriendFollowers(friend.id, user.id);
        }
    }

    private async validatePassword(password: string, usersPassword: string) {
        return await compare(password, usersPassword);
    }

    async validateUser(email: string, pass: string) {
        const user = await User.findUserByEmail(email);

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const isValid = await this.validatePassword(pass, user.password);

        if (isValid) {
            return new CreatePublicUserDto(user);
        }

        return null;
    }

    async getPublicUserById(id: number) {
        const user = await User.findFullyPopulatedUser(id);

        return new CreatePublicUserDto(user);
    }

    async getPublicUserByEmail(email: string) {
        const user = await User.findFullyPopulatedUser(undefined, email);

        return new CreatePublicUserDto(user);
    }

    async create(data: CreateProps) {
        const isExist = await User.findUserByEmail(data.email);

        if (!!isExist) {
            throw new HttpException('User already exist', HttpStatus.CONFLICT);
        }

        const hashedPassword = await hashPassword(data.password);

        const user = new User();

        user.email = data.email;
        user.password = hashedPassword;
        user.name = data.name;
        user.surname = data.surname;

        const result = await this.usersRepository.save(user);

        return new CreatePublicUserDto(result);
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const user = await User.withFriends(await User.findUserById(id));
        const { followers, followings, password, ...rest } = updateUserDto;

        if (followings) {
            await this.addFriend(user, followings);
        }

        for (const key in rest) {
            if (updateUserDto[key]) {
                user[key] = updateUserDto[key];
            }
        }

        const updatedUser = await this.usersRepository.save(user);

        return new CreatePublicUserDto(updatedUser);
    }

    async remove(id: number) {
        const result = await this.usersRepository.delete({ id });

        return result.affected;
    }
}
