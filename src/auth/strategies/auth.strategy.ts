import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private usersService: UsersService) {
        super({ usernameField: 'email' });
    }

    async validate(email: string, password: string): Promise<any> {
        const user = await this.usersService.validateUser(email, password);

        if (!user) {
            throw new HttpException('Bad credentials', HttpStatus.BAD_REQUEST);
        }

        return user;
    }
}
