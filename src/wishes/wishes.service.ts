import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePublicUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entity/user.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { Wish } from './entities/wish.entity';

@Injectable()
export class WishesService {
    constructor(
        @InjectRepository(Wish)
        private readonly wishesRepository: Repository<Wish>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async create(createWishDto: CreateWishDto) {
        const owner = await this.usersRepository.findOneBy({
            id: createWishDto.userId,
        });

        if (!owner) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const wish = new Wish();

        wish.title = createWishDto.title;
        wish.description = createWishDto.description;
        wish.price = createWishDto.price;
        wish.canBeAnon = createWishDto.canBeAnon;
        wish.isHidden = createWishDto.isHidden;
        wish.isReserved = createWishDto.isReserved;
        wish.picture = createWishDto.picture;
        wish.owner = owner;

        const result = await this.wishesRepository.save(wish);

        return {
            ...result,
            owner: new CreatePublicUserDto(result.owner),
        };
    }

    /*
        PROPOSAL: Handle partial selection of a wishes.
        
        Example: GET url/wishes/2?page=1&items_gap=15
    */
    async findAll(userId: number) {
        const wishes = await this.wishesRepository.find({
            where: {
                owner: {
                    id: userId,
                },
            },
            relations: {
                owner: true,
                reservedBy: true,
            },
        });

        const reservations = await this.wishesRepository.find({
            where: {
                reservedBy: {
                    id: userId,
                },
            },
            relations: {
                owner: true,
                reservedBy: true,
            },
        });

        return {
            wishes,
            reservations,
        };
    }

    async reserve(reserverId: number, wishId: number) {
        const wish = await this.wishesRepository.findOne({
            where: { id: wishId },
            relations: {
                owner: true,
                reservedBy: true,
            },
        });

        if (wish.reservedBy) {
            throw new HttpException(
                'Wish is already reserved',
                HttpStatus.BAD_REQUEST,
            );
        }

        const reserver = await this.usersRepository.findOneBy({
            id: reserverId,
        });

        wish.reservedBy = reserver;
        wish.isReserved = true;

        const result = await this.wishesRepository.save(wish);

        return {
            ...result,
            reservedBy: new CreatePublicUserDto(result.reservedBy),
        };
    }

    async cancel(reserverId: number, wishId: number) {
        const wish = await this.wishesRepository.findOne({
            where: { id: wishId },
            relations: {
                owner: true,
                reservedBy: true,
            },
        });

        if (!wish.reservedBy) {
            throw new HttpException(
                'Wish is not reserved',
                HttpStatus.BAD_REQUEST,
            );
        }

        const isUserReservedAWish = wish.reservedBy.id === reserverId;

        if (!isUserReservedAWish) {
            throw new HttpException(
                'User is not the reserver',
                HttpStatus.BAD_REQUEST,
            );
        }

        wish.reservedBy = null;
        wish.isReserved = false;

        const result = await this.wishesRepository.save(wish);

        return {
            ...result,
            owner: new CreatePublicUserDto(result.owner),
        };
    }

    async update(id: number, updateWishDto: UpdateWishDto) {
        const wish = await this.wishesRepository.findOne({
            where: { id },
            relations: {
                owner: true,
                reservedBy: true,
            },
        });

        for (const key in updateWishDto) {
            wish[key] = updateWishDto[key];
        }

        const result = await this.wishesRepository.save(wish);

        return {
            ...result,
            owner: new CreatePublicUserDto(result.owner),
        };
    }

    async remove(id: number) {
        const wish = await this.wishesRepository.findOne({
            where: { id },
        });

        const result = await this.wishesRepository.delete({ id });

        return result.affected;
    }
}
