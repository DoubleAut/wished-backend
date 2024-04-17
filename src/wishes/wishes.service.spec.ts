import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePublicUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entity/user.entity';
import { Wish } from './entities/wish.entity';
import { WishesService } from './wishes.service';

const getRandomUser = () => {
    const user = new User();

    user.email = crypto.randomUUID();
    user.password = 'test@mail.com';
    user.name = crypto.randomUUID();
    user.surname = crypto.randomUUID();
    user.picture = crypto.randomUUID();

    return user;
};

const getRandomWish = (owner: User, reservedBy?: User) => {
    const wish = new Wish();

    wish.title = crypto.randomUUID();
    wish.description = crypto.randomUUID();
    wish.price = Math.random() * 1000;
    wish.canBeAnon = true;
    wish.isHidden = false;
    wish.isReserved = false;
    wish.picture = crypto.randomUUID();
    wish.owner = owner;
    wish.reservedBy = reservedBy ?? null;

    return wish;
};

describe('UsersController', () => {
    let service: WishesService;
    let wishRepository: Repository<Wish>;
    let userRepository: Repository<User>;

    const mockWishesRepository = {
        save: jest.fn(),
        delete: jest.fn(),
    };

    const mockUsersRepository = {
        save: jest.fn(),
        findOneBy: jest.fn(),
    };

    const WISHES_REPOSITORY_TOKEN = getRepositoryToken(Wish);
    const USERS_REPOSITORY_TOKEN = getRepositoryToken(User);

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                WishesService,
                {
                    provide: WISHES_REPOSITORY_TOKEN,
                    useValue: mockWishesRepository,
                },
                {
                    provide: USERS_REPOSITORY_TOKEN,
                    useValue: mockUsersRepository,
                },
            ],
        }).compile();

        service = moduleRef.get<WishesService>(WishesService);
        wishRepository = moduleRef.get<Repository<Wish>>(
            WISHES_REPOSITORY_TOKEN,
        );
        userRepository = moduleRef.get<Repository<User>>(
            USERS_REPOSITORY_TOKEN,
        );
    });

    describe('Should pass all included tests with valid data', () => {
        it('Should successfully create a wish', async () => {
            const owner = getRandomUser();

            const request = {
                title: 'test',
                description: 'test',
                price: 22,
                canBeAnon: false,
                isHidden: false,
                isReserved: true,
                picture: '',
                userId: owner.id,
            };

            const savedWish = {
                ...request,
                owner,
            } as unknown as Wish;

            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(owner);

            jest.spyOn(wishRepository, 'save').mockResolvedValue(savedWish);

            expect(await service.create(request)).toStrictEqual({
                ...savedWish,
                owner: new CreatePublicUserDto(owner),
            });
        });

        it('Should find all wishes', async () => {
            const owner = getRandomUser();
            const reserver = getRandomUser();
            const wishes: Wish[] = [
                getRandomWish(owner),
                {
                    ...getRandomWish(owner, reserver),
                    canBeAnon: false,
                } as unknown as Wish,
                {
                    ...getRandomWish(owner, reserver),
                    canBeAnon: true,
                } as unknown as Wish,
            ];

            jest.spyOn(Wish, 'getWishes').mockResolvedValue(wishes);

            const allWishes = await service.findAll(owner.id);

            expect(allWishes[0]).toEqual(wishes[0]);
            expect(allWishes[1]).toHaveProperty('reservedBy');
            expect(allWishes[2].reservedBy).toEqual(null);
        });

        it('Should reserve a wish', async () => {
            const owner = getRandomUser();
            const reserver = getRandomUser();
            const wish = getRandomWish(owner);

            jest.spyOn(Wish, 'getWishWithReserver').mockResolvedValue(wish);
            jest.spyOn(User, 'findOneBy').mockResolvedValue(reserver);
            jest.spyOn(wishRepository, 'save').mockResolvedValue({
                ...wish,
                reservedBy: reserver,
            } as Wish);

            expect(await service.reserve(reserver.id, wish.id)).toStrictEqual({
                ...wish,
                reservedBy: reserver,
            });
        });

        it('Should cancel a reserved wish', async () => {
            const owner = getRandomUser();
            const reserver = getRandomUser();
            const wishWithReserver = getRandomWish(owner, reserver);

            jest.spyOn(Wish, 'getWishWithReserver').mockResolvedValue(
                wishWithReserver,
            );
            jest.spyOn(User, 'findOneBy').mockResolvedValue(reserver);
            jest.spyOn(wishRepository, 'save').mockResolvedValue({
                ...wishWithReserver,
                reservedBy: null,
            } as Wish);

            expect(
                await service.cancel(reserver.id, wishWithReserver.id),
            ).toStrictEqual({
                ...wishWithReserver,
                reservedBy: null,
            });
        });

        it('Should update a reserved wish', async () => {
            const owner = getRandomUser();
            const wish = getRandomWish(owner);

            jest.spyOn(Wish, 'findOneBy').mockResolvedValue(wish);
            jest.spyOn(wishRepository, 'save').mockResolvedValue(wish);

            expect(
                await service.update(wish.id, { description: 'Test' }),
            ).toEqual({
                ...wish,
                description: 'Test',
            });
        });

        it('Should delete a wish', async () => {
            const owner = getRandomUser();
            const wish = getRandomWish(owner);

            jest.spyOn(wishRepository, 'delete').mockResolvedValue({
                affected: 1,
                raw: '',
            });

            expect(await service.remove(wish.id)).toEqual(1);
        });
    });

    describe('Testing the methods with thrown error', () => {
        it('Should throw an error on reservation, if wish is reserved', async () => {
            const owner = getRandomUser();
            const wish = getRandomWish(owner, getRandomUser());
            const newReserver = getRandomUser();

            jest.spyOn(Wish, 'getWishWithReserver').mockResolvedValue(wish);

            const methodWithThrownError = async () => {
                await service.reserve(newReserver.id, wish.id);
            };

            expect(methodWithThrownError).rejects.toThrow(
                'Wish is already reserved',
            );
        });

        it('Should throw an error on cancelation, if wish is not reserved', async () => {
            const owner = getRandomUser();
            const reserver = getRandomUser();
            const wishWithReserver = getRandomWish(owner);

            jest.spyOn(Wish, 'getWishWithReserver').mockResolvedValue(
                wishWithReserver,
            );

            const methodWithThrownError = async () => {
                await service.cancel(reserver.id, wishWithReserver.id);
            };

            expect(methodWithThrownError).rejects.toThrow(
                'Wish is not reserved',
            );
        });

        it('Should throw an error on cancelation, if wish is not reserved by provided id', async () => {
            const owner = getRandomUser();
            const reserver = getRandomUser();
            const wishWithReserver = getRandomWish(owner, reserver);

            jest.spyOn(Wish, 'getWishWithReserver').mockResolvedValue(
                wishWithReserver,
            );

            const methodWithThrownError = async () => {
                await service.cancel(123, wishWithReserver.id);
            };

            expect(methodWithThrownError).rejects.toThrow(
                'User is not the reserver',
            );
        });
    });
});
