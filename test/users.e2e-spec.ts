import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import * as request from 'supertest';
import { UsersModule } from '../src/users/users.module';

describe('UsersController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [UsersModule],
            controllers: [UsersController],
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/users (CREATE A USER)', () => {
        return request(app.getHttpServer())
            .post('/users')
            .send({
                email: 'richard@mail.com',
                password: 'testing',
                name: 'Richard',
                surname: 'Pickman',
            })
            .expect(201)
            .expect({
                id: expect.any(Number),
                email: 'richard@mail.com',
                password: 'testing',
                name: 'Richard',
                surname: 'Pickman',
                isActive: false,
                picture: null,
            });
    });

    it('/:id (GET)', () => {
        return request(app.getHttpServer()).get('/users/9').expect(200);
    });
});
