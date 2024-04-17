import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePublicUserDto } from './dto/create-user.dto';
import { User } from './entity/user.entity';
import { hashPassword } from './helpers/service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const followers = [
    {
        id: Date.now(),
        email: 'mail@mail.com',
        password: 'h38df90238d',
        name: 'Richard',
        surname: 'Pickman',
        isActive: false,
        picture: null,
    },
];

const followings = [
    {
        id: Date.now(),
        email: 'mail@mail.com',
        password: 'h38df90238d',
        name: 'Richard',
        surname: 'Pickman',
        isActive: false,
        picture: null,
    },
];

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;
    let repository: Repository<User>;

    const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

    const usersMockedService = {
        save: jest.fn(),
        createQueryBuilder: () => ({
            orWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
        }),
        findUserById: jest.fn(),
        findUserByEmail: jest.fn(),
        withWishes: jest.fn(),
        withFriends: jest.fn(),
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                UsersService,
                {
                    provide: USER_REPOSITORY_TOKEN,
                    useValue: usersMockedService,
                },
                {
                    provide: AccessAuthGuard,
                    useValue: jest.fn().mockImplementation(() => true),
                },
            ],
        }).compile();

        controller = moduleRef.get<UsersController>(UsersController);
        service = moduleRef.get<UsersService>(UsersService);
        repository = moduleRef.get<Repository<User>>(USER_REPOSITORY_TOKEN);
    });

    describe('Should pass all included tests with valid data', () => {
        it('Should create a user', async () => {
            const user = {
                email: 'mail@mail.com',
                password: '123Qweasd',
                name: 'Richard',
                surname: 'Pickman',
            };

            // @ts-expect-error ignore private method error!
            jest.spyOn(service, 'findUserByEmail').mockImplementation(
                () => null,
            );

            const createdUser = {
                id: Date.now(),
                email: 'mail@mail.com',
                password: await hashPassword(user.password),
                name: 'Richard',
                surname: 'Pickman',
                isActive: false,
                picture: null,
            } as unknown as User;

            jest.spyOn(repository, 'save').mockResolvedValue(createdUser);

            const result = new CreatePublicUserDto(createdUser);

            expect(await controller.create(user)).toEqual(result);
        });

        it('Should return an updated user', async () => {
            const user = {
                id: Date.now(),
                name: 'Alex',
            };

            const foundUser = {
                id: Date.now(),
                email: 'mail@mail.com',
                password: 'h38df90238d',
                name: 'Richard',
                surname: 'Pickman',
                isActive: false,
                picture: null,
                followers,
                followings,
            } as unknown as User;

            // @ts-expect-error ignore private method error!
            jest.spyOn(service, 'findUserById').mockResolvedValue(foundUser);

            const updatedUser = {
                ...foundUser,
                name: user.name,
            } as unknown as User;

            jest.spyOn(repository, 'save').mockResolvedValue(updatedUser);

            const result = new CreatePublicUserDto(updatedUser);

            expect(await controller.update(user.id, user)).toEqual(result);
        });

        it('Should return a user by ID', async () => {
            const user = {
                id: 1,
                email: 'mail@mail.com',
                name: 'Richard',
                surname: 'Pickman',
                picture: null,
                isActive: false,
            };

            jest.spyOn(service, 'getPublicUserById').mockResolvedValue(user);

            expect(await controller.findOne(1)).toEqual(user);
        });

        it('Should return a amount of removed entities', async () => {
            jest.spyOn(service, 'remove').mockResolvedValue(1);
            expect(await controller.remove(1)).toEqual(1);
        });
    });
});
