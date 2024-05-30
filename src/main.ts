import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { createRouteHandler } from 'uploadthing/express';
import { AppModule } from './app.module';
import { uploadRouter } from './uploadthing';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
        origin: 'http://localhost:3000',
        credentials: true,
    });

    app.use(cookieParser());

    app.use(
        '/uploadthing',
        createRouteHandler({
            router: uploadRouter,
        }),
    );

    const configService = app.get(ConfigService);
    const port = configService.get<string>('API_PORT');

    await app.listen(port);
}

bootstrap();
