import { Body, Controller, Get, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { UserId } from 'src/decorators/userId.decorator';
import { CreateUserDto } from './__dtos__/createUser.dto';
import { ReturnUserDto } from './__dtos__/returnUser.dto';
import { UpdatePasswordDto } from './__dtos__/updatePassword.dto';
import { Role } from './__enums__/role.enum';
import { UsersService } from './users.service';

@Roles(Role.Admin)
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    @UsePipes(ValidationPipe)

    @Post()
    async createUser(@Body() createUser: CreateUserDto): Promise<ReturnUserDto> {
        return new ReturnUserDto(await this.usersService.createUser(createUser));
    }

    @Get()
    async getAllUsers(): Promise<ReturnUserDto[]> {
        return (await this.usersService.getAllUsers()).map((user) => new ReturnUserDto(user));
    }

    @Get('/:userId')
    async getUserById(@Param('userId') userId: string): Promise<ReturnUserDto> {
        return new ReturnUserDto(await this.usersService.findUserByIdUsingRelations(userId));
    }

    @UsePipes(ValidationPipe)
    @Patch()
    async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto, @UserId() userId: string): Promise<ReturnUserDto> {
        return new ReturnUserDto(await this.usersService.updatePassword(updatePasswordDto, userId));
    }
}