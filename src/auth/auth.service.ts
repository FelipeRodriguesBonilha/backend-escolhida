import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/generated/prisma/client';
import { validatePassword } from 'src/utils/password';
import { ReturnUserDto } from '../users/__dtos__/returnUser.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './__dtos__/login.dto';
import { LoginPayloadDto } from './__dtos__/loginPayload.dto';
import { ReturnLoginDto } from './__dtos__/returnLogin.dto';

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async login(loginDto: LoginDto): Promise<ReturnLoginDto> {
        const user: User | undefined = await this.usersService.findUserByEmail(loginDto.email).catch(() => undefined);

        const isMatch = await validatePassword(loginDto.password, user?.password || '');

        if (!user || !isMatch) {
            throw new NotFoundException('Email ou senha invalidos')
        }

        return {
            accessToken: await this.jwtService.signAsync({ ...new LoginPayloadDto(user) }),
            user: new ReturnUserDto(user)
        }
    }
}