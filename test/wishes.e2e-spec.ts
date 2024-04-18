import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entity/user.entity';
import { Wish } from '../src/wishes/entities/wish.entity';

const getRandomWish = (userId: number) => ({
    title: crypto.randomUUID(),
    description: crypto.randomUUID(),
    price: (Math.random() * 1000).toFixed(0),
    canBeAnon: false,
    isHidden: true,
    isReserved: false,
    picture: crypto.randomUUID(),
    userId,
});

describe('Wishes (e2e)', () => {
    let app: INestApplication;

    const registerANewUserAndReturnUserWithToken = async () => {
        const newUser = await request(app.getHttpServer())
            .post('/users')
            .send({
                email: `${crypto.randomUUID()}@mail.com`,
                password: 'testing',
                name: crypto.randomUUID(),
                surname: crypto.randomUUID(),
            });

        const newSignedUser = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: newUser.body.email,
                password: 'testing',
            });

        return {
            newUser,
            newSignedUser,
        };
    };

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

        await dataSource.createQueryBuilder().delete().from(Wish).execute();

        await dataSource.createQueryBuilder().delete().from(User).execute();
    });

    let userResponose: request.Response;
    let signResponose: request.Response;

    beforeEach(async () => {
        userResponose = await request(app.getHttpServer()).post('/users').send({
            email: 'richard@mail.com',
            password: 'testing',
            name: 'Richard',
            surname: 'Pickman',
        });

        signResponose = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'richard@mail.com',
                password: 'testing',
            });
    });

    describe('/wishes POST', () => {
        it('/wishes (create a wish with valid data)', () => {
            return request(app.getHttpServer())
                .post('/wishes')
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send(getRandomWish(userResponose.body.id))
                .expect(201);
        });

        it('/wishes (should return error on bad data)', () => {
            return request(app.getHttpServer())
                .post('/wishes')
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send({
                    ...getRandomWish(userResponose.body.id),
                    title: null,
                })
                .expect(400);
        });

        it('/wishes (should return error on wish creation with invalid user id)', () => {
            return request(app.getHttpServer())
                .post('/wishes')
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send({
                    ...getRandomWish(222),
                    title: null,
                })
                .expect(403);
        });
    });

    describe('/wishes GET', () => {
        it('/wishes/:id (find all wishes)', async () => {
            const wishesResponse = [
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send(getRandomWish(userResponose.body.id))
                    .expect(201),
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send(getRandomWish(userResponose.body.id))
                    .expect(201),
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send(getRandomWish(userResponose.body.id))
                    .expect(201),
            ];

            return request(app.getHttpServer())
                .get(`/wishes/${userResponose.body.id}`)
                .expect(200);
        });

        it('/wishes/findAll (find all wishes with reservation)', async () => {
            const wishesResponse = [
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send({
                        ...getRandomWish(userResponose.body.id),
                        canBeAnon: true,
                    })
                    .expect(201),
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send({
                        ...getRandomWish(userResponose.body.id),
                        canBeAnon: false,
                    })
                    .expect(201),
            ];

            const { newSignedUser } =
                await registerANewUserAndReturnUserWithToken();

            await request(app.getHttpServer())
                .post(`/wishes/reserve/${wishesResponse[0].body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${newSignedUser.body.accessToken}`,
                )
                .expect(201);

            await request(app.getHttpServer())
                .post(`/wishes/reserve/${wishesResponse[1].body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${newSignedUser.body.accessToken}`,
                )
                .expect(201);

            const { body } = await request(app.getHttpServer())
                .get(`/wishes/${userResponose.body.id}`)
                .expect(200);

            const wishOne = body.find(
                (wish) => wish.id === wishesResponse[0].body.id,
            );
            const wishTwo = body.find(
                (wish) => wish.id === wishesResponse[1].body.id,
            );

            // Test wish with hidden reserver
            expect(wishOne.reservedBy).toBe(null);

            // Test wish with reserver
            expect(wishTwo.reservedBy.id === newSignedUser.body.id).toBe(true);
        });

        it('/wishes/reserve/:id (should reserve a wish)', async () => {
            const wishesResponse = [
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send({
                        ...getRandomWish(userResponose.body.id),
                        canBeAnon: true,
                    })
                    .expect(201),
            ];

            const { newSignedUser } =
                await registerANewUserAndReturnUserWithToken();

            return request(app.getHttpServer())
                .post(`/wishes/reserve/${wishesResponse[0].body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${newSignedUser.body.accessToken}`,
                )
                .expect(201);
        });

        it('/wishes/reserve/:id (should raise an error if wish already reserved)', async () => {
            const wishesResponse = [
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send({
                        ...getRandomWish(userResponose.body.id),
                        canBeAnon: true,
                    })
                    .expect(201),
            ];

            const { newSignedUser } =
                await registerANewUserAndReturnUserWithToken();

            const { newSignedUser: signedUser } =
                await registerANewUserAndReturnUserWithToken();

            await request(app.getHttpServer())
                .post(`/wishes/reserve/${wishesResponse[0].body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${newSignedUser.body.accessToken}`,
                )
                .expect(201);

            return request(app.getHttpServer())
                .post(`/wishes/reserve/${wishesResponse[0].body.id}`)
                .set('Authorization', `Bearer ${signedUser.body.accessToken}`)
                .expect(400);
        });

        it('/wishes/cancel/:id (should cancel a reserved wish)', async () => {
            const wishesResponse = [
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send({
                        ...getRandomWish(userResponose.body.id),
                        canBeAnon: true,
                    })
                    .expect(201),
            ];

            const { newSignedUser } =
                await registerANewUserAndReturnUserWithToken();

            await request(app.getHttpServer())
                .post(`/wishes/reserve/${wishesResponse[0].body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${newSignedUser.body.accessToken}`,
                )
                .expect(201);

            return request(app.getHttpServer())
                .post(`/wishes/cancel/${wishesResponse[0].body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${newSignedUser.body.accessToken}`,
                )
                .expect(201);
        });

        it('/wishes/cancel/:id (should raise an error on cancel a reserved wish by other user)', async () => {
            const wishesResponse = [
                await request(app.getHttpServer())
                    .post('/wishes')
                    .set(
                        'Authorization',
                        `Bearer ${signResponose.body.accessToken}`,
                    )
                    .send({
                        ...getRandomWish(userResponose.body.id),
                        canBeAnon: true,
                    })
                    .expect(201),
            ];

            const { newSignedUser } =
                await registerANewUserAndReturnUserWithToken();

            await request(app.getHttpServer())
                .post(`/wishes/reserve/${wishesResponse[0].body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${newSignedUser.body.accessToken}`,
                )
                .expect(201);

            const { newSignedUser: secondUser } =
                await registerANewUserAndReturnUserWithToken();

            return request(app.getHttpServer())
                .post(`/wishes/cancel/${wishesResponse[0].body.id}`)
                .set('Authorization', `Bearer ${secondUser.body.accessToken}`)
                .expect(400);
        });

        it('/wishes/remove/:id (should remove a wish)', async () => {
            const wishResponse = await request(app.getHttpServer())
                .post('/wishes')
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send(getRandomWish(userResponose.body.id))
                .expect(201);

            return request(app.getHttpServer())
                .delete(`/wishes/${wishResponse.body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send({
                    userId: signResponose.body.id,
                })
                .expect(200);
        });

        it('/wishes/remove/:id (should return an error if userId is not the same)', async () => {
            const wishResponse = await request(app.getHttpServer())
                .post('/wishes')
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send(getRandomWish(userResponose.body.id))
                .expect(201);

            return request(app.getHttpServer())
                .delete(`/wishes/${wishResponse.body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send({
                    userId: 222,
                })
                .expect(403);
        });

        it('/wishes/update/:id (should properly update the wish)', async () => {
            const wishResponse = await request(app.getHttpServer())
                .post('/wishes')
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send(getRandomWish(userResponose.body.id))
                .expect(201);

            return request(app.getHttpServer())
                .patch(`/wishes/${wishResponse.body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send({
                    userId: signResponose.body.id,
                    title: 'Test123',
                })
                .expect(200);
        });

        it('/wishes/update/:id (should return error when user updating not his own wish)', async () => {
            const wishResponse = await request(app.getHttpServer())
                .post('/wishes')
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send(getRandomWish(userResponose.body.id))
                .expect(201);

            return request(app.getHttpServer())
                .patch(`/wishes/${wishResponse.body.id}`)
                .set(
                    'Authorization',
                    `Bearer ${signResponose.body.accessToken}`,
                )
                .send({
                    userId: 222,
                    title: 'Test123',
                })
                .expect(403);
        });
    });
});
