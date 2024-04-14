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

    private findUserById(id: number) {
        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.id = :id', { id })
            .getOne();
    }

    private findUserByEmail(email: string) {
        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.email = :email', {
                email,
            })
            .getOne();
    }

    private withWishes(user: User) {
        return this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.wishes', 'wish')
            .where('user.id = :id', { id: user.id })
            .getOne();
    }

    private withFriends(user: User) {
        return this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.followers', 'followers')
            .leftJoinAndSelect('user.followings', 'followings')
            .where('user.id = :id', { id: user.id })
            .getOne();
    }

    private findFullyPopulatedUser(id?: number, email?: string) {
        return this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.wishes', 'wishes')
            .leftJoinAndSelect('user.followers', 'followers')
            .leftJoinAndSelect('user.followings', 'followings')
            .where('user.id = :id', { id })
            .orWhere('user.email = :email', { email })
            .getOne();
    }

    private async updateFriendFollowers(friendId: number, userId: number) {
        const friend = await this.withFriends(
            await this.findUserById(friendId),
        );
        const user = await this.withFriends(await this.findUserById(userId));

        friend.followers.push(user);

        this.usersRepository.save(friend);
    }

    private async addFriend(user: User, friendId: number) {
        const friend = await this.findUserById(friendId);
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
        const user = await this.findUserByEmail(email);

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
        const user = await this.findFullyPopulatedUser(id);

        return new CreatePublicUserDto(user);
    }

    async getPublicUserByEmail(email: string) {
        const user = await this.findFullyPopulatedUser(undefined, email);

        return new CreatePublicUserDto(user);
    }

    async create(data: CreateProps) {
        const isExist = await this.findUserByEmail(data.email);

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
        const user = await this.withFriends(await this.findUserById(id));
        const { followings, password, ...rest } = updateUserDto;

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
