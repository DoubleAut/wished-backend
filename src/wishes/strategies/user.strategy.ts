import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Validation guard - checks the identity of decoded JWT token and userId provided in the body
 */
@Injectable()
export class ValidationGuard implements CanActivate {
    constructor() {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        return request.user.sub === request.body.userId;
    }
}
