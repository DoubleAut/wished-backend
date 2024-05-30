import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entity/user.entity';
import { UsersModule } from 'src/users/users.module';
import { AccessTokenStrategy } from '../auth/strategies/access.strategy';
import { UsersService } from '../users/users.service';
import { MediaController } from './media.controller';

@Module({
    imports: [UsersModule, TypeOrmModule.forFeature([User])],
    controllers: [MediaController],
    providers: [AccessTokenStrategy, UsersService],
})
export class MediaModule {}
