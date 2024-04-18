import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Auth } from '../src/auth/entity/auth.entity';
import { User } from '../src/users/entity/user.entity';

describe('UsersController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, ConfigModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(new ValidationPipe());
        app.use(cookieParser());

        await app.init();
    });

    afterEach(async () => {
        const dataSource = app.get(DataSource);

        await dataSource.createQueryBuilder().delete().from(Auth).execute();
    });

    describe('/auth', () => {
        let user: request.Response;

        beforeEach(async () => {
            user = await request(app.getHttpServer()).post('/users').send({
                email: 'richard@mail.com',
                password: 'testing',
                name: 'Richard',
                surname: 'Pickman',
            });
        });

        afterEach(async () => {
            const dataSource = app.get(DataSource);

            await dataSource.createQueryBuilder().delete().from(User).execute();
        });

        it('/auth/login (should succesfully log in)', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                });

            expect(response.body.accessToken).toBeTruthy();
            expect(response.statusCode).toBe(201);
        });

        it('/auth/login (should reject log in if credentials are wrong)', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'richard@mail.com',
                    password: 'test222',
                })
                .expect(400);
        });

        it('/auth/logout (should succesfully log out)', async () => {
            const signedUser = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                });

            const result = await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Berarer ${signedUser.body.accessToken}`)
                .send({
                    email: 'richard@mail.com',
                });

            expect(result.statusCode).toBe(201);
        });

        it('/auth/logout (should reject log out with bad token)', async () => {
            await request(app.getHttpServer()).post('/auth/login').send({
                email: 'richard@mail.com',
                password: 'testing',
            });

            const result = await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Berarer jh0w349q7fah3q8974hf`)
                .send({
                    email: 'richard@mail.com',
                });

            expect(result.statusCode).toBe(401);
        });

        it('/auth/logout (should reject log out with bad token)', async () => {
            const signedUser = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'richard@mail.com',
                    password: 'testing',
                });

            const cookies = signedUser.headers['set-cookie'];

            const result = await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Cookie', [...cookies])
                .send({
                    email: 'richard@mail.com',
                });

            expect(result.body.accessToken).toStrictEqual(expect.any(String));
        });
    });
});
