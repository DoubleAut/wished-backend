import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    'refresh-jwt',
) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    return req.cookies?.refreshToken;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: {
        sub: number;
        email: string;
        iat: number;
        exp: number;
    }) {
        return { id: payload.sub, email: payload.email };
    }
}
