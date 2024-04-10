import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
    Strategy,
    'access-jwt',
) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    if (!req.headers?.authorization) {
                        return null;
                    }

                    const [key, value] = req.headers?.authorization.split(' ');

                    return value;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: unknown) {
        return payload;
    }
}
