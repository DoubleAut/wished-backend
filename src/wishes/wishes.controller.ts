import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { WishesService } from './wishes.service';

@Controller('wishes')
export class WishesController {
    constructor(private readonly wishesService: WishesService) {}

    @UseGuards(AccessAuthGuard)
    @Post()
    async create(@Req() request: Request, @Body() updateDto: CreateWishDto) {
        const user = request.user as { sub: number; email: string };
        const isUserValid = updateDto.userId === user.sub;

        if (!isUserValid) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        return await this.wishesService.create(updateDto);
    }

    @Get(':id')
    async findAll(@Param('id', ParseIntPipe) userId: number) {
        return await this.wishesService.findAll(userId);
    }

    @UseGuards(AccessAuthGuard)
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateWishDto: UpdateWishDto,
    ) {
        return this.wishesService.update(id, updateWishDto);
    }

    @UseGuards(AccessAuthGuard)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.wishesService.remove(id);
    }

    @UseGuards(AccessAuthGuard)
    @Post('reserve/:id')
    reserve(
        @Param('id', ParseIntPipe) id: number,
        @Body('reserverId', ParseIntPipe) reserverId: number,
    ) {
        return this.wishesService.reserve(reserverId, id);
    }
}
