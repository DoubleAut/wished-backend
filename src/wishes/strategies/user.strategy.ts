import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from 'src/auth/constants';

@Injectable()
export class UserValidationStrategy extends PassportStrategy(
    Strategy,
    'user-validation',
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

    async validate(user: unknown) {
        return user;
    }
}
