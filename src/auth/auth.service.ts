import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Auth } from './entity/auth.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectRepository(Auth)
        private readonly authRepository: Repository<Auth>,
    ) {}

    private async generateTokens(user: { sub: number; email: string }) {
        const tokens = {
            accessToken: await this.jwtService.signAsync(user, {
                expiresIn: '5m',
            }),
            refreshToken: await this.jwtService.signAsync(user, {
                expiresIn: '30d',
            }),
        };

        return tokens;
    }

    private async saveTokensAndReturn(tokens: {
        userId: number;
        accessToken: string;
        refreshToken: string;
    }) {
        const result = new Auth();

        result.userId = tokens.userId;
        result.accessToken = tokens.accessToken;
        result.refreshToken = tokens.refreshToken;

        return this.authRepository.save(result);
    }

    private async updateTokensAndReturn(
        tokens: { accessToken: string; refreshToken: string },
        savedTokens: Auth,
    ) {
        savedTokens.accessToken = tokens.accessToken;
        savedTokens.refreshToken = tokens.refreshToken;

        return this.authRepository.save(savedTokens);
    }

    async validateToken(token: string) {
        const isValid = await this.jwtService.verifyAsync(token);

        return !!isValid;
    }

    async signIn(user: { sub: number; email: string }) {
        const userTokens = await this.authRepository.findOneBy({
            userId: user.sub,
        });

        const payload = { sub: user.sub, email: user.email };
        const tokens = await this.generateTokens(payload);

        if (!userTokens) {
            return await this.saveTokensAndReturn({
                ...tokens,
                userId: user.sub,
            });
        } else {
            return await this.updateTokensAndReturn(tokens, userTokens);
        }
    }

    async refresh(email: string) {
        const user = await this.usersService.getPublicUserByEmail(email);
        const userTokens = await this.authRepository.findOneBy({
            userId: user.id,
        });

        const payload = { sub: user.id, email: user.email };
        const tokens = await this.generateTokens(payload);

        await this.updateTokensAndReturn(tokens, userTokens);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    async signOut(email: string) {
        const user = await this.usersService.getPublicUserByEmail(email);
        const userTokens = await this.authRepository.findOneBy({
            userId: user.id,
        });

        await this.authRepository.delete(userTokens);

        return await this.authRepository.delete(userTokens);
    }
}
