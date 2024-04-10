import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entity/user.entity';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { Wish } from './entities/wish.entity';
import { UserValidationStrategy } from './strategies/user.strategy';
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
    providers: [WishesService, UserValidationStrategy, UsersService],
})
export class WishesModule {}
