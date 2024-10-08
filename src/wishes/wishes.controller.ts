import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { WishesService } from './wishes.service';

@Controller('wishes')
export class WishesController {
    constructor(private readonly wishesService: WishesService) {}

    @UseGuards(AccessAuthGuard)
    @Post()
    async create(@Body() updateDto: CreateWishDto) {
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
    @Patch('reserve/:id')
    reserve(@Req() request: Request, @Param('id', ParseIntPipe) id: number) {
        const user = request.user as { sub: number; email: string };

        return this.wishesService.reserve(user.sub, id);
    }

    @UseGuards(AccessAuthGuard)
    @Delete('cancel/:id')
    cancel(@Req() request: Request, @Param('id', ParseIntPipe) wishId: number) {
        const user = request.user as { sub: number; email: string };

        return this.wishesService.cancel(user.sub, wishId);
    }
}
