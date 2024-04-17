import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entity/user.entity';

describe('UsersController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, ConfigModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(new ValidationPipe());

        await app.init();
    });

    afterEach(async () => {
        const dataSource = app.get(DataSource);

        await dataSource.createQueryBuilder().delete().from(User).execute();
    });

    describe('/users POST', () => {
        it('/users (create a user with valid data)', () => {
            return request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                    name: 'Richard',
                    surname: 'Pickman',
                })
                .expect(201);
        });

        it('/users (should return an error, when user exist)', async () => {
            await request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                    name: 'Richard',
                    surname: 'Pickman',
                })
                .expect(201);

            return request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                    name: 'Richard',
                    surname: 'Pickman',
                })
                .expect(409);
        });

        it('/users (should return an error, when data is invalid)', async () => {
            return request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'richardmail',
                    password: 'asd',
                    name: undefined,
                })
                .expect(400);
        });
    });

    describe('/users GET', () => {
        it('/users (get newly created user)', async () => {
            const user = await request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                    name: 'Richard',
                    surname: 'Pickman',
                });

            return request(app.getHttpServer())
                .get(`/users/${user.body.id}`)
                .expect(200);
        });

        it('/users (return error when user is not found)', async () => {
            return request(app.getHttpServer()).get(`/users/122`).expect(404);
        });
    });

    describe('/users UPDATE', () => {
        let userResponse: request.Response;
        let signedUserResponse: request.Response;
        let friendResponse: request.Response;

        beforeEach(async () => {
            userResponse = await request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                    name: 'Richard',
                    surname: 'Pickman',
                });

            signedUserResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                });

            friendResponse = await request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'alex@mail.com',
                    password: 'testing',
                    name: 'Alex',
                    surname: 'The Reaper',
                });
        });

        it('/users (should successfully update the user)', async () => {
            const updatedUser = await request(app.getHttpServer())
                .patch(`/users/${userResponse.body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${signedUserResponse.body.accessToken}`,
                )
                .send({
                    name: 'Alex',
                    followings: friendResponse.body.id,
                })
                .expect(200);

            return request(app.getHttpServer())
                .patch(`/users/${userResponse.body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${signedUserResponse.body.accessToken}`,
                )
                .send({
                    name: 'Alex',
                    followings: friendResponse.body.id,
                })
                .expect(200)
                .expect({
                    ...updatedUser.body,
                    name: 'Alex',
                    followings: [{ ...friendResponse.body }],
                });
        });

        it('/users (should return error on follow not existing user)', async () => {
            return request(app.getHttpServer())
                .patch(`/users/${userResponse.body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${signedUserResponse.body.accessToken}`,
                )
                .send({
                    followings: 1,
                })
                .expect(400);
        });

        it('/users (should return error on unauthorized request)', async () => {
            return request(app.getHttpServer())
                .patch(`/users/${userResponse.body.id}`)
                .send({
                    followings: 1,
                })
                .expect(401);
        });
    });

    describe('/users DELETE', () => {
        let userResponse: request.Response;
        let friendResponse: request.Response;

        beforeEach(async () => {
            userResponse = await request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                    name: 'Richard',
                    surname: 'Pickman',
                });

            friendResponse = await request(app.getHttpServer())
                .post('/users')
                .send({
                    email: 'alex@mail.com',
                    password: 'testing',
                    name: 'Alex',
                    surname: 'The Reaper',
                });
        });

        it('/users (should successfully remove the user)', async () => {
            const signedUser = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                });

            return request(app.getHttpServer())
                .delete(`/users/${userResponse.body.id}`)
                .set('Authorization', `Bearer ${signedUser.body.accessToken}`)
                .expect(200);
        });

        it('/users (should rejectif user is not authorized)', async () => {
            return request(app.getHttpServer())
                .delete(`/users/${userResponse.body.id}`)
                .expect(401);
        });
    });
});
