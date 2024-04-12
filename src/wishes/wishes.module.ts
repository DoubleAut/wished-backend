import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenStrategy } from '../auth/strategies/access.strategy';
import { User } from '../users/entity/user.entity';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { Wish } from './entities/wish.entity';
import { WishesController } from './wishes.controller';
import { WishesService } from './wishes.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wish]),
        TypeOrmModule.forFeature([User]),
        PassportModule,
        UsersModule,
    ],
    controllers: [WishesController],
    providers: [WishesService, AccessTokenStrategy, UsersService],
})
export class WishesModule {}
