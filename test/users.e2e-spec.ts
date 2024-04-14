import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { User } from '../src/users/entity/user.entity';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';

describe('UsersController (e2e)', () => {
    let app: INestApplication;

    const mockUsersRepository = {};

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [UsersModule],
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUsersRepository,
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/users (CREATE A USER)', () => {
        return request(app.getHttpServer())
            .post('/users')
            .set({
                email: 'richard@mail.com',
                password: 'testing',
                name: 'Richard',
                surname: 'Pickman',
            })
            .expect(201);
    });

    it('/:id (GET)', () => {
        return request(app.getHttpServer()).get('/users/9').expect(200);
    });
});
