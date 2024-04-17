import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePublicUserDto } from './dto/create-user.dto';
import { User } from './entity/user.entity';
import { hashPassword } from './helpers/service';
import { UsersService } from './users.service';

describe('UsersController', () => {
    let service: UsersService;
    let repository: Repository<User>;

    const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

    const usersMockedRepository = {
        save: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: () => ({
            leftJoin: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockReturnThis(),
        }),
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: USER_REPOSITORY_TOKEN,
                    useValue: usersMockedRepository,
                },
            ],
        }).compile();

        service = moduleRef.get<UsersService>(UsersService);
        repository = moduleRef.get<Repository<User>>(USER_REPOSITORY_TOKEN);
    });

    describe('Should pass all included tests', () => {
        const savedUser = {
            id: 1,
            name: 'Alex',
            surname: 'The Reaper',
            email: 'alex@mail.com',
            picture: null,
            isActive: false,
        };

        it('Should validate user', async () => {
            const password = '123asd';
            const hashedPass = await hashPassword(password);
            const user = {
                ...savedUser,
                password: hashedPass,
            };

            // @ts-expect-error Ignore unknown method, because its private
            jest.spyOn(service, 'findUserByEmail').mockResolvedValue(user);

            const result = new CreatePublicUserDto(user);

            expect(await service.validateUser(user.email, password)).toBe(
                result,
            );
        });

        it('Should return null, if user is not validated', async () => {
            const password = '123asd';

            // @ts-expect-error Ignore unknown method, because its private
            jest.spyOn(service, 'findUserByEmail').mockResolvedValue({
                ...savedUser,
                password: '2983hc083',
            });

            expect(await service.validateUser(savedUser.email, password)).toBe(
                null,
            );
        });

        it('Should find user with provided id or email', async () => {
            const user = {
                ...savedUser,
                followers: [],
                followings: [],
                wishes: [],
            };

            // @ts-expect-error Ignore unknown method, because its private
            jest.spyOn(service, 'findFullyPopulatedUser').mockResolvedValue(
                user,
            );

            expect(await service.getPublicUserById(user.id)).toBe(
                new CreatePublicUserDto(user),
            );

            expect(await service.getPublicUserByEmail(user.email)).toBe(
                new CreatePublicUserDto(user),
            );
        });

        it('Should create and return the new user', async () => {
            const user = {
                ...savedUser,
                password: 'asudhoqh8iwhd',
                followers: [],
                followings: [],
                wishes: [],
            };

            // @ts-expect-error Ignore unknown method, because its private
            jest.spyOn(service, 'findUserByEmail').mockResolvedValue(null);
            jest.spyOn(repository, 'save').mockResolvedValue(
                user as unknown as User,
            );

            expect(
                await service.create({
                    name: user.name,
                    surname: user.surname,
                    password: user.password,
                    email: user.email,
                }),
            ).toBe(new CreatePublicUserDto(user));
        });

        it('Should properly update the user', async () => {
            const user = {
                ...savedUser,
                password: 'asudhoqh8iwhd',
                followers: [],
                followings: [],
                wishes: [],
            };

            const friend = {
                ...savedUser,
                id: 3,
                name: 'richard',
                surname: 'pickman',
            };

            usersMockedRepository
                .createQueryBuilder()
                .getOne.mockResolvedValue(user);

            // @ts-expect-error Ignore unknown method, because its private
            jest.spyOn(service, 'withFriends').mockResolvedValue(user);

            // @ts-expect-error Ignore unknown method, because its private
            jest.spyOn(service, 'findUserById').mockResolvedValue(user);

            // @ts-expect-error Ignore unknown method, because its private
            jest.spyOn(service, 'addFriend').mockImplementation(() => {
                user.followings.push(friend);
            });

            usersMockedRepository.save.mockResolvedValue(user);

            expect(
                await service.update(savedUser.id, {
                    name: 'richard',
                    followings: 3,
                }),
            ).toStrictEqual({
                ...user,
                name: 'richard',
                followings: [friend],
            });

            expect(service['addFriend']).toHaveBeenCalled();
        });

        it('Should find a user by email', async () => {
            const user = {
                ...savedUser,
                password: 'asudhoqh8iwhd',
                followers: [],
                followings: [],
                wishes: [],
            };

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'findFullyPopulatedUser').mockResolvedValue(
                user,
            );

            const result = new CreatePublicUserDto(user);

            expect(await service.getPublicUserByEmail(user.email)).toBe(result);
        });

        it('Should find a user by Id', async () => {
            const user = {
                ...savedUser,
                password: 'asudhoqh8iwhd',
                followers: [],
                followings: [],
                wishes: [],
            };

            // @ts-expect-error Ignore private method error
            jest.spyOn(service, 'findFullyPopulatedUser').mockResolvedValue(
                user,
            );

            expect(await service.getPublicUserById(user.id)).toBe(
                new CreatePublicUserDto(user),
            );
        });

        it('Should return User on findUserById call', async () => {
            const user = {
                ...savedUser,
            };

            usersMockedRepository
                .createQueryBuilder()
                .getOne.mockResolvedValue(user);

            // @ts-expect-error ignore private method call
            expect(await service.findUserById(user.id));
        });

        it('Should return a fully populated user', async () => {
            const user = {
                ...savedUser,
                password: 'asudhoqh8iwhd',
                followers: [],
                followings: [],
                wishes: [],
            };

            const usersMockedService: any = {
                leftJoin: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockReturnValue(user),
            };

            jest.spyOn(
                usersMockedRepository,
                'createQueryBuilder',
            ).mockReturnValue(usersMockedService);

            // @ts-expect-error ignore private function
            expect(await service.findFullyPopulatedUser(user.id)).toBe(
                new CreatePublicUserDto(user),
            );
        });

        it('Should succesfully remove the user', async () => {
            const user = {
                ...savedUser,
                password: 'asudhoqh8iwhd',
                followers: [],
                followings: [],
                wishes: [],
            };

            jest.spyOn(usersMockedRepository, 'delete').mockResolvedValue({
                affected: 1,
            });

            expect(await service.remove(user.id)).toBe(1);
        });

        it('Should addFriend without raising an error', async () => {
            const user = new User();

            user.email = savedUser.email;
            user.name = savedUser.name;
            user.surname = savedUser.surname;
            user.followings = [];
            user.followers = [];

            const friend = new User();

            friend.email = savedUser.email;
            friend.name = savedUser.name;
            friend.surname = savedUser.surname;
            friend.followings = [];
            friend.followers = [];

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'findUserById').mockResolvedValue(friend);

            await service['addFriend'](user, 2);

            expect(user.followings).toContain(friend);
        });

        it('Should update friend followers properly', async () => {
            const friend = new User();

            friend.email = savedUser.email;
            friend.name = savedUser.name;
            friend.surname = savedUser.surname;
            friend.followings = [];
            friend.followers = [];

            const user = {
                ...savedUser,
                followers: [],
                followings: [],
            };

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'findUserById').mockResolvedValue(friend);

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'withFriends').mockResolvedValue(user);

            await service['updateFriendFollowers'](friend, 2);

            expect(friend.followers).toContain(user);
        });

        it('Should do nothing, if user already in the followings', async () => {
            const friend = new User();

            friend.email = savedUser.email;
            friend.name = savedUser.name;
            friend.surname = savedUser.surname;
            friend.followings = [];
            friend.followers = [];

            const user = new User();

            user.email = savedUser.email;
            user.name = savedUser.name;
            user.surname = savedUser.surname;
            user.followings = [friend];
            user.followers = [];

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'findUserById').mockResolvedValue(friend);

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'withFriends').mockResolvedValue(user);

            await service['updateFriendFollowers'](user, friend.id);

            expect(friend.followers).not.toContain(user);
        });
    });

    describe('Should pass tests with throwing an error', () => {
        const savedUser = {
            id: 1,
            name: 'Alex',
            surname: 'The Reaper',
            email: 'alex@mail.com',
            picture: null,
            isActive: false,
        };

        it('Should throw an error if user is not found by email', async () => {
            // @ts-expect-error ignore private function
            jest.spyOn(service, 'findFullyPopulatedUser').mockResolvedValue(
                null,
            );

            const executedMethodWithThrownError = async () => {
                await service.getPublicUserByEmail('aosuihda@mail.com');
            };

            expect(executedMethodWithThrownError).rejects.toThrow(
                'User not found',
            );
        });

        it('Should throw an error if user is not found by id', async () => {
            // @ts-expect-error Ignore private method error
            jest.spyOn(service, 'findFullyPopulatedUser').mockResolvedValue(
                null,
            );

            const executedMethodWithThrownError = async () => {
                await service.getPublicUserById(22);
            };

            expect(executedMethodWithThrownError).rejects.toThrow(
                'User not found',
            );
        });

        it('Should throw an error, if user exist', async () => {
            const user = {
                ...savedUser,
                password: 'asudhoqh8iwhd',
                followers: [],
                followings: [],
                wishes: [],
            };

            usersMockedRepository
                .createQueryBuilder()
                .getOne.mockResolvedValue(user);

            const result = async () =>
                await service.create({
                    name: user.name,
                    surname: user.surname,
                    password: user.password,
                    email: user.email,
                });
            expect(result).rejects.toThrow('User already exist');
        });

        it('Should throw an error, if friend not found', async () => {
            const user = new User();

            user.email = savedUser.email;
            user.name = savedUser.name;
            user.surname = savedUser.surname;
            user.followings = [];
            user.followers = [];

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'findUserById').mockResolvedValue(null);

            const methodWithThrownError = async () => {
                await service['addFriend'](user, 222);
            };

            expect(methodWithThrownError).rejects.toThrow('Friend not found');
        });

        it('Should throw an error, if validation is not passed', async () => {
            // @ts-expect-error ignore private function
            jest.spyOn(service, 'findUserByEmail').mockResolvedValue(null);

            const methodWithThrownError = async () => {
                await service.validateUser('asd@mail.com', '123asd');
            };

            expect(methodWithThrownError).rejects.toThrow('User not found');
        });
    });
});
