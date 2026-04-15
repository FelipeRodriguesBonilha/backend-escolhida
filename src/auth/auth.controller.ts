import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { LoginDto } from './__dtos__/login.dto';
import { ReturnLoginDto } from './__dtos__/returnLogin.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) { }

    @UsePipes(ValidationPipe)
    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<ReturnLoginDto> {
        return this.authService.login(loginDto);
    }
}