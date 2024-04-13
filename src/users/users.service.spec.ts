import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [UsersService],
        }).compile();

        service = moduleRef.get<UsersService>(UsersService);
        repository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    });

    describe('UsersServiceCreate', () => {
        it('Should create a user', async () => {
            const user = {
                email: 'mail@mail.com',
                password: '123Qweasd',
                name: 'Richard',
                surname: 'Pickman',
            };

            expect(await service.create(user)).toEqual({
                ...user,
                id: expect.any(Number),
                picture: null,
                isActive: false,
            });
        });

        it('Should return an updated user', async () => {
            const user = {
                email: 'mail@mail.com',
                password: '123Qweasd',
                name: 'Alex',
                surname: 'Pickman',
                picture: null,
                isActive: false,
            };

            expect(await service.update(1, user)).toEqual({
                ...user,
                id: expect.any(Number),
            });
        });

        it('Should return a amount of removed entities', async () => {
            expect(await service.remove(1)).toEqual(1);
        });
    });
});
