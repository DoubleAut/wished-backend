import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { PublicUserDTO } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { AccessAuthGuard, RefreshAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const user = request.user as PublicUserDTO;

        const tokens = await this.authService.signIn(user);

        response.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
        });

        const result = {
            ...request.user,
            accessToken: tokens.accessToken,
        };

        return result;
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
    @Post('refresh')
    async refresh(
        @Body('email') email: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const tokens = await this.authService.refresh(email);

        response.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
        });

        return {
            accessToken: tokens.accessToken,
        };
    }
}
