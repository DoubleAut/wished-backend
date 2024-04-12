import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entity/user.entity';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { Auth } from './entity/auth.entity';
import { AccessTokenStrategy } from './strategies/access.strategy';
import { AuthStrategy } from './strategies/auth.strategy';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        TypeOrmModule.forFeature([Auth]),
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
        }),
    ],
    providers: [
        AuthService,
        UsersService,
        AuthStrategy,
        AccessTokenStrategy,
        RefreshTokenStrategy,
    ],
    controllers: [AuthController],
})
export class AuthModule {}
