import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { PublicUserDTO } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { AccessAuthGuard, RefreshAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ) {}

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const user = request.user as PublicUserDTO;

        const tokens = await this.authService.signIn(user);

        const decodedRefreshToken = this.jwtService.decode(tokens.refreshToken);

        response.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: true,
            expires: new Date(decodedRefreshToken.exp * 1000),
            sameSite: 'lax',
        });

        return {
            ...request.user,
            accessToken: tokens.accessToken,
        };
    }

    @UseGuards(AccessAuthGuard)
    @Post('logout')
    async logout(
        @Body('email') email: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        response.clearCookie('refreshToken', { httpOnly: true });
        response.removeHeader('Authorization');

        return this.authService.signOut(email);
    }

    @UseGuards(RefreshAuthGuard)
    @Get('refresh')
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const user = request.user as { id: number; email: string };
        const tokens = await this.authService.refresh(user.email);

        const decodedRefreshToken = this.jwtService.decode(tokens.refreshToken);

        response.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: true,
            expires: new Date(decodedRefreshToken.exp * 1000),
            sameSite: 'lax',
        });

        return {
            id: user.id,
            accessToken: tokens.accessToken,
        };
    }
}
