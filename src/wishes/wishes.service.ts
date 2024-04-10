import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePublicUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entity/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { Wish } from './entities/wish.entity';

@Injectable()
export class WishesService {
    constructor(
        private readonly usersService: UsersService,
        @InjectRepository(Wish)
        private readonly wishesRepository: Repository<Wish>,
    ) {}

    async create(createWishDto: CreateWishDto) {
        const user = await User.findUserById(createWishDto.userId);
        const wish = new Wish();

        wish.title = createWishDto.title;
        wish.description = createWishDto.description;
        wish.price = createWishDto.price;
        wish.canBeAnon = createWishDto.canBeAnon;
        wish.isHidden = createWishDto.isHidden;
        wish.isReserved = createWishDto.isReserved;
        wish.picture = createWishDto.picture;
        wish.user = user;

        const result = await this.wishesRepository.save(wish);

        return {
            ...result,
            user: new CreatePublicUserDto(result.user),
        };
    }

    /*
        TODO: Handle partial selection of a wishes.
        
        Example: GET url/wishes/2?page=1&items_gap=15
    */
    async findAll(userId: number) {
        const user = await this.usersService.getPublicUserById(userId);

        return user.wishes;
    }

    async update(id: number, updateWishDto: UpdateWishDto) {
        const wish = await Wish.findOneBy({ id });
        const { user, ...rest } = updateWishDto;

        for (const key in rest) {
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
