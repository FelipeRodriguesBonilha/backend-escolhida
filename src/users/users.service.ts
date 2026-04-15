import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { createPasswordHashed, validatePassword } from 'src/utils/password';
import { CreateUserDto } from './__dtos__/createUser.dto';
import { UpdatePasswordDto } from './__dtos__/updatePassword.dto';

@Injectable()
export class UsersService {

    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const user = await this.findUserByEmail(createUserDto.email).catch(() => undefined);

        if (user) {
            throw new BadRequestException('Email already registered')
        }

        const passwordHashed = await createPasswordHashed(createUserDto.password)

        return this.prismaService.user.create({
            data: {
                ...createUserDto,
                password: passwordHashed,
            }
        })
    }

    async getAllUsers(): Promise<User[]> {
        return this.prismaService.user.findMany();
    }

    async findUserById(userId: string): Promise<User> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new NotFoundException(`UserId: ${userId} Not Found`);
        }

        return user;
    }

    async findUserByEmail(email: string): Promise<User> {
        const user = await this.prismaService.user.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            throw new NotFoundException(`Email: ${email} Not Found`);
        }

        return user;
    }

    async findUserByIdUsingRelations(userId: string): Promise<User> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
        });

        if (!user) {
            throw new NotFoundException(`UserId: ${userId} Not Found`);
        }

        return user;
    }

    async updatePassword(updatePasswordDto: UpdatePasswordDto, userId: string): Promise<User> {
        const user = await this.findUserById(userId);

        const isMatch = await validatePassword(updatePasswordDto.lastPassword, user.password || '');

        if (!isMatch) {
            throw new BadRequestException('Last password invalid');
        }

        const passwordHashed = await createPasswordHashed(updatePasswordDto.newPassword);

        return this.prismaService.user.update({
            where: {
                id: userId
            },
            data: {
                password: passwordHashed
            }
        })
    }
}