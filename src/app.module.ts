import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Auth } from './auth/entity/auth.entity';
import { User } from './users/entity/user.entity';
import { UsersModule } from './users/users.module';
import { Wish } from './wishes/entities/wish.entity';
import { WishesModule } from './wishes/wishes.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        WishesModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'admin',
            password: 'example',
            database: 'wished',
            entities: [Wish, User, Auth],
            synchronize: true,
        }),
    ],
})
export class AppModule {}
