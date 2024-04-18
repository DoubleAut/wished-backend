import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthStrategy } from './strategies/auth.strategy';

describe('AuthService', () => {
    let controller: AuthController;
    let service: AuthService;
    let jwt: JwtService;

    const mockAuthService = {
        signIn: jest.fn(),
        signOut: jest.fn(),
        refresh: jest.fn(),
    };
    const mockUserService = {
        validateUser: jest.fn(),
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    secret: 'lmao',
                }),
                PassportModule,
            ],
            controllers: [AuthController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUserService,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: AuthStrategy,
                    useValue: {
                        validate: jest.fn().mockResolvedValue({
                            id: 1,
                            email: 'user@example.com',
                        }), // Mock successful validation
                    },
                },
                AuthStrategy,
                JwtService,
            ],
        }).compile();

        controller = moduleRef.get<AuthController>(AuthController);
        service = moduleRef.get<AuthService>(AuthService);
        jwt = moduleRef.get<JwtService>(JwtService);
    });

    describe('Should pass all tests with valid data', () => {
        it('Should login', async () => {
            const req: Request = {} as Request;
            const res = {
                cookie: jest.fn().mockReturnThis(),
            };

            req.user = { id: 1, email: 'user@example.com' };

            // @ts-expect-error ignore next line
            jest.spyOn(service, 'signIn').mockResolvedValue({
                accessToken: 'abc123',
                refreshToken: 'def456',
            });

            // @ts-expect-error ignore wrong cookie method
            const result = await controller.login(req, res);

            expect(result).toEqual({
                id: 1,
                email: 'user@example.com',
                accessToken: 'abc123',
            });
            expect(service.signIn).toHaveBeenCalledWith({
                id: 1,
                email: 'user@example.com',
            });
        });

        it('Should logout', async () => {
            const res = {
                clearCookie: jest.fn().mockReturnThis(),
                removeHeader: jest.fn().mockReturnThis(),
            };

            jest.spyOn(service, 'signOut').mockResolvedValue(1);

            // @ts-expect-error ignore wrong methods of a response
            expect(await controller.logout('test@mail.com', res)).toEqual(1);
        });

        it('Should refresh tokens', async () => {
            const res = {
                cookie: jest.fn().mockReturnThis(),
            };

            const tokens = {
                accessToken: await jwt.signAsync({ email: 'test@mail.com' }),
                refreshToken: await jwt.signAsync({ email: 'test@mail.com' }),
            };

            jest.spyOn(service, 'refresh').mockResolvedValue(tokens);

            // @ts-expect-error ignore wrong methods of a response
            expect(await controller.refresh('test@mail.com', res)).toEqual({
                accessToken: tokens.accessToken,
            });
        });
    });
});
