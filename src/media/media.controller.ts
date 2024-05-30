import {
    Body,
    Controller,
    Delete,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { utapi } from 'src/uploadthing';
import { UsersService } from 'src/users/users.service';
import { AccessAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
export class MediaController {
    constructor(private readonly userService: UsersService) {}

    @UseGuards(AccessAuthGuard)
    @Delete(':key')
    async delete(@Req() request: Request, @Param('key') key: string) {
        const user = request.user as { sub: number; email: string };
        const result = await utapi.deleteFiles(key);

        if (!result.success) {
            throw new HttpException(
                'Deleting image failed',
                HttpStatus.BAD_REQUEST,
            );
        }

        return await this.userService.update(user.sub, { picture: null });
    }

    @Patch()
    async update(@Req() request: Request, @Body() updateDto: { url: string }) {
        const user = request.user as { sub: number; email: string };

        return await this.userService.update(user.sub, {
            picture: updateDto.url,
        });
    }
}
