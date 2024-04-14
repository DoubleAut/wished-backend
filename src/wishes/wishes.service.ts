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
        const wishes = await Wish.getWishes(userId);

        return wishes.map((wish) => {
            if (wish.canBeAnon) {
                const { reservedBy, ...rest } = wish;

                return rest;
            }

            return {
                ...wish,
                reservedBy: new CreatePublicUserDto(wish.reservedBy),
            };
        });
    }

    async reserve(reserverId: number, wishId: number) {
        const wish = await Wish.getWishWithReserver(wishId);

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

        const result = await this.wishesRepository.save(wish);

        return {
            ...result,
            reservedBy: new CreatePublicUserDto(result.reservedBy),
        };
    }

    async cancel(reserverId: number, wishId: number) {
        const wish = await Wish.getWishWithReserver(wishId);

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

        const result = await this.wishesRepository.save(wish);

        return result;
    }

    async update(id: number, updateWishDto: UpdateWishDto) {
        const wish = await Wish.findOneBy({ id });

        for (const key in updateWishDto) {
            if (updateWishDto[key]) {
                wish[key] = updateWishDto[key];
            }
        }

        return await this.wishesRepository.save(wish);
    }

    async remove(id: number) {
        const result = await this.wishesRepository.delete({ id });

        return result.affected;
    }
}
