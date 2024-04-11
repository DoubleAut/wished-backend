import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Validation guard - checks the decoded JWT token and userId provided in the body, to verificate the identity that made a request
 */
@Injectable()
export class ValidationGuard implements CanActivate {
    constructor() {}
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        return request.user.sub === request.body.userId;
    }
}
