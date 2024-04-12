import { Test } from '@nestjs/testing';
import { AccessAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
    let usersController: UsersController;

    const mockUsersService = {};

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

    it('should return an array of cats', async () => {
        expect(usersController).toBeDefined();
    });
});
