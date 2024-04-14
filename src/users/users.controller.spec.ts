import { Test } from '@nestjs/testing';
import { AccessAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
    let usersController: UsersController;

    const mockUsersService = {
        create: jest.fn((dto) => ({
            id: 1,
            email: 'mail@mail.com',
            password: '123Qweasd',
            name: 'Richard',
            surname: 'Pickman',
            picture: null,
            isActive: false,
        })),
        update: jest.fn((dto) => ({
            id: 1,
            email: 'mail@mail.com',
            password: '123Qweasd',
            name: 'Alex',
            surname: 'Pickman',
            picture: null,
            isActive: false,
        })),
        getPublicUserById: jest.fn((dto) => ({
            id: 1,
            email: 'mail@mail.com',
            password: '123Qweasd',
            name: 'Richard',
            surname: 'Pickman',
            picture: null,
            isActive: false,
        })),
        remove: jest.fn((dto) => 1),
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: AccessAuthGuard,
                    useValue: jest.fn().mockImplementation(() => true),
                },
            ],
        }).compile();

        usersController = moduleRef.get<UsersController>(UsersController);
    });

    describe('UsersControllerCreate', () => {
        it('Should create a user', async () => {
            const user = {
                email: 'mail@mail.com',
                password: '123Qweasd',
                name: 'Richard',
                surname: 'Pickman',
            };

            expect(await usersController.create(user)).toEqual({
                ...user,
                id: expect.any(Number),
                picture: null,
                isActive: false,
            });
        });

        it('Should return an updated user', async () => {
            const user = {
                name: 'Alex',
            };

            expect(await usersController.update(1, user)).toEqual({
                id: expect.any(Number),
                email: 'mail@mail.com',
                password: '123Qweasd',
                name: 'Alex',
                surname: 'Pickman',
                picture: null,
                isActive: false,
            });
        });

        it('Should return a user by ID', async () => {
            const user = {
                id: 1,
                email: 'mail@mail.com',
                password: '123Qweasd',
                name: 'Richard',
                surname: 'Pickman',
                picture: null,
                isActive: false,
            };

            expect(await usersController.findOne(1)).toEqual(user);
        });

        it('Should return a amount of removed entities', async () => {
            expect(await usersController.remove(1)).toEqual(1);
        });
    });
});
