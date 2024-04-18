import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from 'express';
import { AccessAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entity/user.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { Wish } from './entities/wish.entity';
import { WishesController } from './wishes.controller';
import { WishesService } from './wishes.service';

describe('UsersController', () => {
    let controller: WishesController;
    let service: WishesService;

    const mockWishesService = {
        create: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        reserve: jest.fn(),
        cancel: jest.fn(),
    };

    const mockWishesRepository = {
        save: jest.fn(),
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [WishesController],
            providers: [
                {
                    provide: WishesService,
                    useValue: mockWishesService,
                },
                {
                    provide: getRepositoryToken(Wish),
                    useValue: mockWishesRepository,
                },
                {
                    provide: AccessAuthGuard,
                    useValue: jest.fn().mockImplementation(() => true),
                },
            ],
        }).compile();

        controller = moduleRef.get<WishesController>(WishesController);
        service = moduleRef.get<WishesService>(WishesService);
    });

    describe('Should pass all included tests with valid data', () => {
        it('Should create a wish', async () => {
            const wish: CreateWishDto = {
                title: '',
                description: '',
                price: 123,
                canBeAnon: true,
                isHidden: false,
                isReserved: false,
                picture: '',
                userId: 1,
            };

            const createdWish = {
                ...wish,
                owner: new User(),
                id: 1,
                reservedBy: null,
            };

            mockWishesService.create.mockResolvedValue(createdWish);

            expect(await controller.create(wish)).toBe(createdWish);
        });

        it('Should find all wishes', async () => {
            const wish: CreateWishDto = {
                title: '',
                description: '',
                price: 123,
                canBeAnon: true,
                isHidden: false,
                isReserved: false,
                picture: '',
                userId: 1,
            };

            const owner = new User();

            const result = [
                {
                    ...wish,
                    owner,
                    id: 1,
                    canBeAnon: true,
                    reservedBy: null,
                } as unknown as Wish,
                {
                    ...wish,
                    canBeAnon: false,
                    owner,
                    id: 1,
                    reservedBy: new User(),
                } as unknown as Wish,
            ];

            jest.spyOn(service, 'findAll').mockResolvedValue(result);

            expect(await controller.findAll(1)).toBe(result);
        });

        it('Should update a wish', async () => {
            const wish: CreateWishDto = {
                title: '',
                description: '',
                price: 123,
                canBeAnon: true,
                isHidden: false,
                isReserved: false,
                picture: '',
                userId: 1,
            };

            const updatedValues = {
                description: 'Test',
            };

            jest.spyOn(service, 'update').mockResolvedValue({
                ...wish,
                ...updatedValues,
            } as unknown as Wish);

            expect(await controller.update(1, updatedValues)).toStrictEqual({
                ...wish,
                ...updatedValues,
            });
        });

        it('Should remove a wish', async () => {
            jest.spyOn(service, 'remove').mockResolvedValue(1);

            expect(await controller.remove(1)).toBe(1);
        });

        it('Should reserve a wish', async () => {
            const request = {
                user: {
                    sub: 1,
                    email: 'test@mail.com',
                },
            } as unknown as Request;

            const reserver = new User();

            const result = {
                id: 1,
                title: 'test',
                description: 'test',
                price: 22,
                canBeAnon: false,
                isHidden: false,
                isReserved: true,
                picture: '',
                owner: new User(),
                reservedBy: reserver,
            };

            jest.spyOn(service, 'reserve').mockResolvedValue(result);

            expect(await controller.reserve(request, 1)).toBe(result);
        });

        it('Should reserve a wish', async () => {
            const request = {
                user: {
                    sub: 1,
                    email: 'test@mail.com',
                },
            } as unknown as Request;

            const result = {
                id: 1,
                title: 'test',
                description: 'test',
                price: 'test',
                canBeAnon: false,
                isHidden: false,
                isReserved: false,
                picture: '',
                owner: new User(),
                reservedBy: null,
            } as unknown as Wish;

            jest.spyOn(service, 'cancel').mockResolvedValue(result);

            expect(await controller.cancel(request, 1)).toBe(result);
        });
    });
});
