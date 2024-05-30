import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { AccessAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.getPublicUserById(id);
    }

    @Get(':id/friends')
    getUserFriends(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.getUserFriends(id);
    }

    @Get()
    findAll() {
        return this.usersService.getAll();
    }

    @UseGuards(AccessAuthGuard)
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(id, updateUserDto);
    }

    @UseGuards(AccessAuthGuard)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.remove(id);
    }

    @UseGuards(AccessAuthGuard)
    @Post(':userId/friends/:friendId')
    addFriend(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('friendId', ParseIntPipe) friendId: number,
    ) {
        return this.usersService.addFriend(userId, friendId);
    }

    @UseGuards(AccessAuthGuard)
    @Delete(':userId/friends/:friendId')
    removeFriend(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('friendId', ParseIntPipe) friendId: number,
    ) {
        return this.usersService.removeFriend(userId, friendId);
    }
}
