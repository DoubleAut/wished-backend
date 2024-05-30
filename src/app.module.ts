import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Auth } from './auth/entity/auth.entity';
import { validate } from './config';
import { MediaModule } from './media/media.module';
import { User } from './users/entity/user.entity';
import { UsersModule } from './users/users.module';
import { Wish } from './wishes/entities/wish.entity';
import { WishesModule } from './wishes/wishes.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        WishesModule,
        MediaModule,
        ConfigModule.forRoot({
            isGlobal: true,
            validate,
            envFilePath: `.env.${process.env.NODE_ENV}`,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('HOST'),
                port: configService.get<number>('PORT'),
                username: configService.get<string>('USERNAME'),
                password: configService.get<string>('PASSWORD'),
                database: configService.get<string>('DATABASE'),
                entities: [Wish, User, Auth],
                synchronize: configService.get<boolean>('SYNCHRONIZE'),
            }),
        }),
    ],
})
export class AppModule {}
