import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UserValidationGuard extends AuthGuard('user-validation') {}
