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

    private findUserByEmail(email: string) {
        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.email = :email', {
                email,
            })
            .getOne();
    }

    async getUserFriends(id: number) {
        const userFriends = await this.usersRepository.findOne({
            where: { id },
            select: {
                followers: true,
                followings: true,
            },
            relations: {
                followers: true,
                followings: true,
            },
        });

        if (!userFriends) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return userFriends;
    }

    private async findFullyPopulatedUser(id?: number, email?: string) {
        const user = await this.usersRepository.findOne({
            where: { id, email },
            relations: ['followings', 'followers', 'wishes', 'reservations'],
        });

        return user;
    }

    async addFriend(userId: number, friendId: number) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['followings', 'followers'],
        });

        const friend = await this.usersRepository.findOne({
            where: { id: friendId },
            relations: ['followings', 'followers'],
        });

        if (!friend) {
            throw new HttpException('Friend not found', HttpStatus.BAD_REQUEST);
        }

        const isIncluded = user.followings.find(
            (friend) => friend.id === friendId,
        );

        if (!isIncluded) {
            user.followings.push(friend);
            friend.followers.push(user);

            await this.usersRepository.save(user);
            await this.usersRepository.save(friend);
        }

        const result = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['followings', 'followers'],
        });

        return new CreatePublicUserDto(result);
    }

    async removeFriend(userId: number, friendId: number) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['followings', 'followers'],
        });

        const friend = await this.usersRepository.findOne({
            where: { id: friendId },
            relations: ['followings', 'followers'],
        });

        if (!friend) {
            throw new HttpException('Friend not found', HttpStatus.BAD_REQUEST);
        }

        user.followings = user.followings.filter(
            (follower) => follower.id !== friendId,
        );
        friend.followers = friend.followers.filter(
            (follower) => follower.id !== userId,
        );

        await this.usersRepository.save(user);
        await this.usersRepository.save(friend);

        const result = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['followings', 'followers'],
        });

        return new CreatePublicUserDto(result);
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
        const user = await this.usersRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return new CreatePublicUserDto(user);
    }

    async getAll() {
        const users = await this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.wishes', 'wishes')
            .leftJoinAndSelect('user.followers', 'followers')
            .leftJoinAndSelect('user.followings', 'followings')
            .leftJoinAndSelect('user.reservations', 'reservedBy')
            .getMany();

        if (!users) {
            throw new HttpException('Users not found', HttpStatus.NOT_FOUND);
        }

        const result = users.map((user) => new CreatePublicUserDto(user));

        return result;
    }

    async getPublicUserByEmail(email: string) {
        const user = await this.findFullyPopulatedUser(undefined, email);

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return new CreatePublicUserDto(user);
    }

    async create(data: CreateProps) {
        const isExist = await this.findUserByEmail(data.email);

        if (!!isExist) {
            throw new HttpException(
                'User with provided email already exist',
                HttpStatus.BAD_REQUEST,
            );
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
        const user = await this.usersRepository.findOne({
            where: { id },
        });
        const { password, ...rest } = updateUserDto;

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
