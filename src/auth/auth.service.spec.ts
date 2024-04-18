import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PublicUserDTO } from 'src/users/dto/create-user.dto';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Auth } from './entity/auth.entity';

describe('AuthService', () => {
    let usersService: UsersService;
    let service: AuthService;
    let jwt: JwtService;
    let repository: Repository<Auth>;

    const mockUserService = {
        getPublicUserByEmail: jest.fn(),
    };

    const mockAuthRepository = {
        findOneBy: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    const AUTH_REPOSITORY_TOKEN = getRepositoryToken(Auth);

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    global: true,
                    secret: 'lmao',
                }),
            ],
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: mockUserService,
                },
                {
                    provide: AUTH_REPOSITORY_TOKEN,
                    useValue: mockAuthRepository,
                },
            ],
        }).compile();

        usersService = moduleRef.get<UsersService>(UsersService);
        service = moduleRef.get<AuthService>(AuthService);
        repository = moduleRef.get<Repository<Auth>>(AUTH_REPOSITORY_TOKEN);
        jwt = moduleRef.get<JwtService>(JwtService);
    });

    describe('Should pass all tests with valid data', () => {
        it('Should signIn with creating a tokens', async () => {
            const user = {
                id: 1,
                email: 'user@mail.com',
            } as unknown as PublicUserDTO;

            const tokens = {
                accessToken: await jwt.signAsync(user),
                refreshToken: await jwt.signAsync(user),
            };
            jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

            jest.spyOn(repository, 'save').mockResolvedValue({
                ...tokens,
                userId: user.id,
                id: 2,
            });

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'generateTokens').mockResolvedValue(tokens);

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'saveTokensAndReturn').mockResolvedValue({
                ...tokens,
                userId: user.id,
                id: 2,
            });

            expect(await service.signIn(user)).toStrictEqual({
                ...tokens,
                userId: user.id,
                id: 2,
            });

            expect(service['saveTokensAndReturn']).toHaveBeenCalled();
        });

        it('Should signIn with updating a tokens', async () => {
            const user = {
                id: 1,
                email: 'user@mail.com',
            } as unknown as PublicUserDTO;

            const tokens = {
                accessToken: await jwt.signAsync(user),
                refreshToken: await jwt.signAsync(user),
            };

            jest.spyOn(repository, 'findOneBy').mockResolvedValue({
                ...user,
                ...tokens,
                userId: user.id,
                id: 2,
            });
            jest.spyOn(repository, 'save').mockResolvedValue({
                ...tokens,
                userId: user.id,
                id: 2,
            });

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'generateTokens').mockResolvedValue(tokens);

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'updateTokensAndReturn').mockResolvedValue({
                ...tokens,
                userId: user.id,
                id: 2,
            });

            expect(await service.signIn(user)).toStrictEqual({
                ...tokens,
                userId: user.id,
                id: 2,
            });

            expect(service['updateTokensAndReturn']).toHaveBeenCalled();
        });

        it('Should refresh tokens', async () => {
            const user = {
                id: 1,
                email: 'user@mail.com',
            } as unknown as PublicUserDTO;

            const tokens = {
                accessToken: await jwt.signAsync(user),
                refreshToken: await jwt.signAsync(user),
            };

            jest.spyOn(usersService, 'getPublicUserByEmail').mockResolvedValue({
                ...user,
                id: 2,
            });

            jest.spyOn(repository, 'findOneBy').mockResolvedValue({
                ...user,
                ...tokens,
                userId: user.id,
                id: 2,
            });

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'generateTokens').mockResolvedValue(tokens);

            // @ts-expect-error ignore private function
            jest.spyOn(service, 'updateTokensAndReturn').mockResolvedValue({
                ...tokens,
                userId: user.id,
                id: 2,
            });

            expect(await service.refresh(user.email)).toStrictEqual(tokens);

            expect(service['updateTokensAndReturn']).toHaveBeenCalled();
        });

        it('Should signOut', async () => {
            const user = {
                id: 1,
                email: 'user@mail.com',
            } as unknown as PublicUserDTO;

            const tokens = {
                accessToken: await jwt.signAsync(user),
                refreshToken: await jwt.signAsync(user),
            };

            jest.spyOn(usersService, 'getPublicUserByEmail').mockResolvedValue({
                ...user,
                id: 2,
            });

            jest.spyOn(repository, 'findOneBy').mockResolvedValue({
                ...user,
                ...tokens,
                userId: user.id,
                id: 2,
            });

            jest.spyOn(repository, 'delete').mockResolvedValue({
                affected: 1,
                raw: '',
            });

            expect(await service.signOut(user.email)).toStrictEqual(1);

            expect(repository['delete']).toHaveBeenCalled();
        });

        it('Should throw an error, if user is not found', async () => {
            const user = {
                id: 1,
                email: 'user@mail.com',
            } as unknown as PublicUserDTO;

            jest.spyOn(usersService, 'getPublicUserByEmail').mockResolvedValue(
                null,
            );

            const methodWithThrownError = async () => {
                await service.signOut(user.email);
            };

            expect(methodWithThrownError).rejects.toThrow('Bad request');
        });

        it('Should return a saved tokens', async () => {
            const user = {
                id: 1,
                email: 'user@mail.com',
            } as unknown as PublicUserDTO;

            const tokens = {
                accessToken: await jwt.signAsync(user),
                refreshToken: await jwt.signAsync(user),
            };

            jest.spyOn(repository, 'save').mockResolvedValue({
                ...user,
                ...tokens,
                userId: user.id,
            });

            expect(
                await service['saveTokensAndReturn']({
                    ...user,
                    ...tokens,
                    userId: user.id,
                }),
            ).toStrictEqual({
                ...user,
                ...tokens,
                userId: user.id,
            });
        });

        it('Should return a updated tokens', async () => {
            const user = {
                id: 1,
                email: 'user@mail.com',
            } as unknown as PublicUserDTO;

            const tokens = {
                accessToken: await jwt.signAsync(user),
                refreshToken: await jwt.signAsync(user),
            };

            jest.spyOn(repository, 'save').mockResolvedValue({
                ...user,
                ...tokens,
                userId: user.id,
            });

            const existingTokens = new Auth();

            existingTokens.userId = user.id;
            existingTokens.accessToken = await jwt.signAsync(user);
            existingTokens.refreshToken = await jwt.signAsync(user);

            expect(
                await service['updateTokensAndReturn'](
                    {
                        ...user,
                        ...tokens,
                    },
                    existingTokens,
                ),
            ).toStrictEqual({
                ...user,
                accessToken: existingTokens.accessToken,
                refreshToken: existingTokens.refreshToken,
                userId: user.id,
            });
        });

        it('Should return a generatedTokens', async () => {
            const user = {
                sub: 1,
                email: 'user@mail.com',
            };

            expect(await service['generateTokens'](user)).toStrictEqual({
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
            });
        });
    });
});
